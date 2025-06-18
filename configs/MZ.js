export default {
  us: [
    {
      matchUrl: (url) => {
        return url.pathname.startsWith("/video/lp");
      },
      as: 2,
      gam: 0,
    },
    {
      matchUrl: (url) => {
        return url.pathname == "/video/" || url.pathname == "/video/index.html";
      },
      as: 2,
      gam: 0,
    },
    {
      matchUrl: (url) => {
        return url.pathname.startsWith("/video/detail");
      },
      as: 2,
      gam: 1,
      actions: [
        {
          selector: "#playBtnImg",
          action: "click",
          delay: 3000,
        },
      ],
    },
    {
      matchUrl: (url) => {
        return url.pathname.startsWith("/detail");
      },
      as: 4,
      gam: 2,
      actions: [
        {
          selector: ".down-link-item,.t-play",
          action: "click",
          delay: 5000,
        },
      ],
    },
    {
      matchUrl: (url) => {
        return true;
      },
      as: 1,
      gam: 1
    },
  ],
};
