# frozen_string_literal: true

module SolidusAvataxCertified
  module Spree
    module PaymentDecorator
      def self.prepended(base)
        return if base.state_machine.callbacks[:after].any? do |c|
          c.instance_variable_get(:@methods)&.include?(:avalara_finalize)
        rescue StandardError
          false
        end

        base.state_machine.after_transition to: :completed, do: :avalara_finalize
        base.state_machine.after_transition to: :void, do: :cancel_avalara
      end

      def avalara_tax_enabled?
        ::Spree::Avatax::Config.tax_calculation
      end

      def cancel_avalara
        order.avalara_transaction&.cancel_order
      end

      def avalara_finalize
        return unless avalara_tax_enabled?

        order.avalara_capture_finalize
      end
      ::Spree::Payment.prepend self
    end
  end
end
