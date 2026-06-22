# frozen_string_literal: true

require 'spec_helper'

RSpec.describe SolidusAvataxCertified::Request::GetTax, :vcr do
  subject { described_class.new(order, commit: false, doc_type: 'SalesOrder') }

  let!(:order) { create(:avalara_order, line_items_count: 2) }

  describe '#generate' do
    it 'creates a hash' do
      expect(subject.generate).to be_kind_of Hash
    end

    it 'Commit has value of false' do
      expect(subject.generate[:createTransactionModel][:commit]).to be false
    end

    it 'has ReferenceCode from base_tax_hash' do
      expect(subject.generate[:createTransactionModel][:referenceCode]).to eq(order.number)
    end

    context 'when order has a manual discount adjustment' do
      before do
        Spree::Adjustment.create!(
          order: order,
          adjustable: order,
          amount: -5.0,
          label: 'Coupon Code',
          eligible: true
        )
      end

      it 'does not include a header-level discount field' do
        result = subject.generate[:createTransactionModel]
        expect(result).not_to have_key(:discount)
      end

      it 'includes the adjustment as a separate negative-amount line item' do
        lines = subject.generate[:createTransactionModel][:lines]
        adj_line = lines.find { |l| l[:number].to_s.include?('ADJ') }
        expect(adj_line).to be_present
        expect(adj_line[:amount]).to eq(-5.0)
        expect(adj_line[:description]).to eq('Coupon Code')
      end
    end
  end
end
