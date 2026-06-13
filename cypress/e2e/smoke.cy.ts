describe("E2E Smoke Tests", () => {
  it("should load the homepage and check title", () => {
    cy.visit("/");
    cy.title().should("include", "WANNASINGH");
  });

  it("should load the health endpoint", () => {
    cy.request("/health").its("body.status").should("eq", "ok");
  });

  it("should check the shopping cart empty state", () => {
    cy.visit("/cart");
    // The selector/ID is 'empty-state' which displays "Your bag is currently empty."
    cy.get("#empty-state").should("be.visible");
    cy.contains("Your bag is currently empty.");
  });
});
