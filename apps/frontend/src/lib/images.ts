/**
 * High-quality, stable Google CDN images from collections page
 * representing the AETHER cyber-minimalist techwear aesthetic
 */
const stableGoogleImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCHFF-Askr-UVEcPxEatG03-NYhria9d1LD89xkSFRsysrpXIb0-XITMLvOob4NG48RStSeUZvnqE-b0SAZ_D2REoczbzNrn_ja6JX8qLfbj5o8EV8uKaT6I89igEyEsDyhTlKc6dWgEOQ1HbTdtwD9xmvaRM-i0Mm5qoW5Zuxpc6OnoQQ0lwxc5O-uaBl4Swcy_WU8x0_ODGNpMMMymEBBqmhJs2NFIfJm2Uhy7s0zGbBqDJxq7es5PhSa0Mv9snsLxe-_XFKGLYYG",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBEBLQdp0-1kvBJRQWQVsotyAdr4P1zLrLAVKcsx-BIevAhnAdUerqyhrHJEVOR3IW1QP2dJz8slM3XieNHLnPAoUe51ZIsYmmFZJQP688RNtK9vDwoN1N3GAvnnD5nYbzw23y8q86DXbbNGskNIiqfTEPBF8XXrraJA5vGKX3GQpm2SXP9MxsxzcQHMCUPwKbwhPBFvh6LytQFapNXZP4dwhhvz1uHoZF5gwtlqeG2eLuNi_YK9ax-jOpJVehlejDYroY3GcCKMWBE",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD6WTv34VitQexJJiT16v3SRk4xSCov8gxQeKuWZie-PLPsI9Tu64Nkdi7iEMqfDzKkhxs7vzhHFhW-wYyyAWfTMEBjzaJoneGu4B23eNKXbsOElwykRDijdKkaurib1Z0XkvpTYG2_3EnlTRS2g0M3qQkVPvhlGLr4bIS1CHnF6uGb0f3GlD8qU71JXyAlLlIZt9B0qTb_VSDQ9gSgXYKCnvOPA5EizjNVKun6f5NROmNmyJTNbPqpoBmnCx6OXSAji-vXYeD7iQsi",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDj080BlpX9quuEZyPbBXuZEqJDkjGgGUBCygUBm8ypVpA5Q1_nzyg_8l2797PWXxaDOtZCj_p629ugTX1E9AdKClIvOM0OPz4P3CpWNCBdGXF8hsh8x0OwCLbBcfbCXeiDb3H18laq7N1iduNdarS8TczvXcgQcQXsMSrjg0hGl935Pd_Nv8rjWCEJQMRYd9GC2KqsmojDBfUMMmqLn2QRQkMUmvYvMSLQaWKDj604VVK6WgZID6nRG_Bsllqd42kyWT-dux0wNxk3",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAduJI42AxGAa90CHHC917vkMZm6rmcX8SxqcFulA-bnXj9reWIBbwdxWLlKI9LrKzAhbxkaIDkB2JcR0ahWI4WmNPBtOkrYPNO1S5Wp0uePYMkRPf9XrzXtQteKZ2CpZifA4_RaQ19ycGm_8t8Ha5ZJUM_UXtNhNOUs18uMxb8yaa9SLWx-5w77E-sfbaKyj3721IX9qMvBoUEtuu9w-rYLW9gxudF7jCDFGDzKsZbLM4BRaQmXMsNEdahBB07uYWatnrB4HVIbMX0",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB6o8eGNrsnN_Cw93q55oLygXOH8w1eidswoGyRCQBEl5GHo3ZEW7uKaSNy_2gsWNaR5ujpA2_jioVBpNjmEin6uQndXi0TinPTsbDXAz0kPYV-aVOLgv91JGCvZNzZiqwaaALW8mai_5-pgdeya82DJs4kfnlsSFSyTs3BGGCY-HlmLihMCyWtKu1k03iU51LV0hexj4nx6oz3SOCXS9uEj3BBEtwrs_yWse0RFen87QoS_uRObyMYqnAKnxy2ov8gbRPWygb8OwGL",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD5j6wILASNWIJgj1ANFebyww1VgywHS8WLxTA4QIG3Psj4N-BPZkozhZRL9aIUfNNpeKB_4jkE43hFkyARpZWvODhEPGUgkq7xbC7WFd3FwKMp_MB3LHb8_oRUAI5Tjhdqeaot2F0uN_lrZwiQZGlEOAX0xjPAYenKCjf5MHO6aMa2hszyFRiYRJlqzNUpyHSiU7UbeNf_r8GdkMeXoioBgHfRd4F9xuof-Xmm9XfUY5Fd-_rTqLwKxInV667-SIJGoxKpGNdYkuBb",
];

/**
 * Returns a stable Google CDN image URL for any loremflickr dynamic URL.
 * If the URL is already stable, returns it as is.
 */
export function getStableImageUrl(originalUrl: string): string {
  if (!originalUrl) return "";

  if (originalUrl.includes("loremflickr.com")) {
    const match = /random=([A-Z]+)-(\d+)/.exec(originalUrl);
    if (match) {
      const prefix = match[1] ?? "";
      const index = Number.parseInt(match[2] ?? "0", 10);

      let hash = 0;
      for (let i = 0; i < prefix.length; i++) {
        hash += prefix.codePointAt(i) ?? 0;
      }

      const stableIndex = (index + hash) % stableGoogleImages.length;
      return stableGoogleImages[stableIndex] ?? "";
    }
  }

  return originalUrl;
}
