//配置1
// export default {
//   "https://mzgen.com/detail/com-roblox-client.html": {
//     as: { vig: 1, display: 3, afg: 2, reward: 2 },
//     gam: { vig: 1, display: 3, afg: 2, reward: 2,video:1 },
//   },
// };

export default {
  check: {
    // "http://192.168.12.9:8080/googleAdSense/afg(reward)/": {as:"3,1",gam:"1"},
    // "http://192.168.12.9:8080/googleAdSense/vig/": {},
    // "http://192.168.12.9:8080/googleAdSense/display/": {},
    // "http://192.168.12.9:8080/googleAdManager/afg/": {},
    // "http://192.168.12.9:8080/googleAdManager/vig/": {},
    // "http://192.168.12.9:8080/googleAdManager/display/": {},
    // "http://192.168.12.9:8080/googleAdManager/reward/": {},
    // "http://192.168.12.9:8080/video/": {},
    "https://mzgen.com/": { as: 1, gam: 1 },
    "https://mzgen.com/detail/com-roblox-client.html": {
      as: 1,
      gam: 1,
      actions: [
        {
          selector: ".down-link-item,.t-play",
          action: "click",
          delay: 3000,
        },
      ],
    },
  },
};

// //配置2
// export default {
//   pc: {
//     "https://babojoy.com/games/d/com-fingersoft-hillclimb.html": {
//       as: { vig: 1, display: 3, afg: 2, reward: 2 },
//       gam: { vig: 1, display: 3, afg: 2, reward: 2,video:1 },
// actions: [
//   {
//     selector: ".down-link-item,.t-play",
//     action: "click",
//     delay: 5000,
//   },
// ],
//     }
//   },
//   ipad: {
//     "https://babojoy.com/games/d/com-fingersoft-hillclimb.html": {
//       as: { vig: 1, display: 3, afg: 2, reward: 2 },
//       gam: { vig: 1, display: 3, afg: 2, reward: 2 },
// actions: [
//   {
//     selector: ".down-link-item,.t-play",
//     action: "click",
//     delay: 5000,
//   },
// ],
//     }
//   },
//   mobile: {
//     "https://babojoy.com/games/d/com-fingersoft-hillclimb.html": {
//       as: { vig: 1, display: 3, afg: 2, reward: 2 },
//       gam: { vig: 1, display: 3, afg: 2, reward: 2 },
// actions: [
//   {
//     selector: ".down-link-item,.t-play",
//     action: "click",
//     delay: 5000,
//   },
// ],
//     }
//   }
// };

// //配置2
// export default {
//   pc: {
//     check: {
//       "https://babojoy.com/games/d/com-fingersoft-hillclimb.html": {
//         as: { vig: 1, display: 3, afg: 2, reward: 2 },
//         gam: { vig: 1, display: 3, afg: 2, reward: 2, video: 1 },
//       },
//     },
//     actions: [],
//   },
//   ipad: {
//     check: {
//       "https://babojoy.com/games/d/com-fingersoft-hillclimb.html": {
//         as: { vig: 1, display: 3, afg: 2, reward: 2 },
//         gam: { vig: 1, display: 3, afg: 2, reward: 2 },
//       },
//     },
//     actions: [],
//   },
//   mobile: {
//     check: {
//       "https://babojoy.com/games/d/com-fingersoft-hillclimb.html": {
//         as: { vig: 1, display: 3, afg: 2, reward: 2 },
//         gam: { vig: 1, display: 3, afg: 2, reward: 2 },
//       },
//     },
//     actions: [],
//   },
// };
