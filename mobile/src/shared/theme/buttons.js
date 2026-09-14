/**
 * The gold button recipe — lifted verbatim from the Vault Setup mock, which
 * is the reference for how a primary action should look everywhere.
 *
 * The shine is three things working together, and dropping any one of them
 * flattens it:
 *
 *   1. a FOUR-stop vertical gradient, weighted toward the top. The stops are
 *      not evenly spaced (0 / 30 / 60 / 100) — that bunching is what reads as
 *      a curved metal surface catching light rather than a linear fade.
 *   2. a warm outer glow beneath, so the button floats off the dark field.
 *   3. a 1px white specular line along the top edge (the mock's
 *      `inset 0 1px 0 rgba(255,255,255,.6)`), which is what makes it look lit
 *      from above rather than merely coloured.
 *
 * CSS source (Vault Setup.html, "Create vault & unlock" button):
 *   background: linear-gradient(180deg,#f7d98d 0%,#e8bd63 30%,#cfa03c 60%,#b6852a 100%)
 *   box-shadow: 0 10px 26px rgba(227,187,104,.28), inset 0 1px 0 rgba(255,255,255,.6)
 *   color:#171208; font-weight:800; border-radius:99px; letter-spacing:-.01em
 */
export const goldButton = {
  colors: ['#F7D98D', '#E8BD63', '#CFA03C', '#B6852A'],
  locations: [0, 0.3, 0.6, 1],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
  specular: 'rgba(255, 255, 255, 0.6)',
  onGold: '#171208',
  glow: {
    shadowColor: '#E3BB68',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 13,
    elevation: 6,
  },
};
