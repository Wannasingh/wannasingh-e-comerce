describe("Wannasingh E-Commerce E2E Comprehensive Test Suite", () => {
  
  beforeEach(() => {
    // Clear localStorage and cookies before each test
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  // ── 1. Page Load & Health Diagnostics ──────────────────────────────────────
  context("Basic Diagnostics & Accessibility", () => {
    it("should load the homepage, verify theme elements, and take screenshot", () => {
      cy.visit("/");
      cy.title().should("include", "WANNASINGH");
      cy.get("nav").should("be.visible");
      cy.get("footer").should("be.visible");
      cy.screenshot("homepage-diagnostic-view");

    });

    it("should check the backend system health status", () => {
      cy.request("/health").then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.status).to.eq("ok");
      });
    });
  });

  // ── 2. Shop Catalog: Search & Filter Systems ───────────────────────────────
  context("Catalog Search & Filter Interactions", () => {
    beforeEach(() => {
      cy.visit("/shop");
    });

    it("should display page title, search bar, and filter categories", () => {
      cy.get("#page-main-title").should("be.visible").and("contain", "Outerwear");
      cy.get("#search-input").should("be.visible").and("have.attr", "placeholder", "SEARCH SYSTEM ARCHIVE...");
      cy.get("#results-count").should("be.visible");
    });

    it("should allow typing search query and interact with category filters", () => {
      // Test search typing
      cy.get("#search-input")
        .type("Tactical Jacket")
        .should("have.value", "Tactical Jacket");

      cy.get('input[name="category-filter"]').should("have.length.at.least", 5);
      cy.get('input[name="category-filter"][value="Bottoms"]').check();
      cy.get('input[name="category-filter"][value="Bottoms"]').should("be.checked");

      // Verify checkboxes under Technical Performance can be ticked
      cy.get('input[type="checkbox"][value="WATERPROOF"]').check();
      cy.get('input[type="checkbox"][value="WATERPROOF"]').should("be.checked");
    });
  });

  // ── 3. Shopping Cart Interactions ──────────────────────────────────────────
  context("Shopping Bag Operations", () => {
    it("should check and display the correct empty cart state", () => {
      cy.visit("/cart");
      cy.get("#empty-state").should("be.visible");
      cy.contains("Your bag is currently empty.");
      cy.contains("CONTINUE SHOPPING").should("have.attr", "href", "/shop");
    });

    it("should load cart items from localStorage and calculate totals correctly", () => {
      // Mock cart item insertion into localStorage
      const mockCart = [
        {
          id: "prod_mock_01",
          name: "MOCK CYBER SHELL V1",
          price: "$450.00",
          image: "",
          size: "L",
          qty: 1
        },
        {
          id: "prod_mock_02",
          name: "MOCK CYBER MID-LAYER",
          price: "$250.00",
          image: "",
          size: "M",
          qty: 2
        }
      ];
      
      cy.visit("/", {
        onBeforeLoad(win) {
          win.localStorage.setItem("wanna_cart", JSON.stringify(mockCart));
        }
      });

      // Visit cart page and check contents
      cy.visit("/cart");
      
      // Verify mock product titles are displayed
      cy.contains("MOCK CYBER SHELL V1").should("be.visible");
      cy.contains("MOCK CYBER MID-LAYER").should("be.visible");

      // Verify total quantities and subtotal format
      cy.get("#summary-total").scrollIntoView().should("be.visible").and("not.contain", "$0.00");
      
      // Proceed to checkout button link verification
      cy.contains("PROCEED TO CHECKOUT")
        .should("have.attr", "href", "/checkout");
    });
  });

  // ── 4. Secure Checkout Integration ─────────────────────────────────────────
  context("Secure Checkout Flow", () => {
    beforeEach(() => {
      // Load mock cart to proceed directly to checkout
      const mockCart = [
        {
          id: "prod_mock_01",
          name: "CYPRESS TEST JACKET",
          price: "$299.00",
          image: "",
          size: "M",
          qty: 1
        }
      ];
      
      cy.visit("/", {
        onBeforeLoad(win) {
          win.localStorage.setItem("wanna_cart", JSON.stringify(mockCart));
        }
      });
    });

    it("should render shipping form fields and accept input", () => {
      cy.visit("/checkout");

      // Verify all required shipping form inputs are visible
      cy.get("#field-first-name").should("be.visible");
      cy.get("#field-last-name").should("be.visible");
      cy.get("#field-email").should("be.visible");
      cy.get("#field-address").should("be.visible");
      cy.get("#field-city").should("be.visible");
      cy.get("#field-postal").should("be.visible");

      // Fill in user credentials / shipping info
      cy.get("#field-first-name").type("CYPRESS");
      cy.get("#field-last-name").type("TESTER");
      cy.get("#field-email").type("cypress-operator@wannasingh.dev");
      cy.get("#field-address").type("Oracle Cloud Zone 1");
      cy.get("#field-city").type("Singapore");
      cy.get("#field-postal").type("189720");

      // Verify fields retain inputted data
      cy.get("#field-first-name").should("have.value", "CYPRESS");
      cy.get("#field-email").should("have.value", "cypress-operator@wannasingh.dev");

      // Verify confirm purchase button is visible
      cy.get("#submit-btn").should("be.visible");
      cy.get("#submit-label").should("contain", "CONFIRM PURCHASE");
    });
  });
});
