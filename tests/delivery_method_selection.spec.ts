import { test, expect } from '@playwright/test';
import { performCheckout } from '../helpers/checkout';

test.describe('Checkout - Delivery Method Selection', () => {
  test('should select delivery method using deliveryMethodMap', async ({ page }) => {
    // Arrange: Navigate to the checkout page
    await page.goto('https://www.menzzo.fr/checkout');

    // Act: Perform checkout with delivery method
    const checkoutData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      address: ['10 Rue Exemple'],
      postalCode: '75001',
      city: 'Paris',
      country: 'France',
      deliveryMethod: 'Home Delivery - At Room',
      paymentMethod: 'Stripe'
    };
    await performCheckout(page, checkoutData);

    // Assert: Verify successful navigation to payment page
    await expect(page).toHaveURL(/https:\/\/checkout\.stripe\.com\/c\/pay\//);
  });
});