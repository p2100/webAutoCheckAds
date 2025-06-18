export default {
  us: [
    {
      matchUrl: (url) => {
        return url.includes("mzgen.com");
      },
      as: 1,
      gam: 1,
      actions: [
        {
          selector: ".down-link-item,.t-play",
          action: "click",
          delay: 0,
        },
      ],
    },
    {
      matchUrl: () => {},
      pc: {
        as: 1,
        gam: 1,
        actions: [
          {
            selector: ".down-link-item,.t-play",
            action: "click",
            delay: 0,
          },
        ],
      },
      ipad: {
        as: 1,
        gam: 1,
        actions: [
          {
            selector: ".down-link-item,.t-play",
            action: "click",
            delay: 0,
          },
        ],
      },
      mobile: {
        as: 1,
        gam: 1,
        actions: [
          {
            selector: ".down-link-item,.t-play",
            action: "click",
            delay: 0,
          },
        ],
      },
    },
  ],
};
