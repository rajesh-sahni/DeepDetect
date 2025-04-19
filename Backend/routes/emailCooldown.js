// emailCooldown.js
let lastEmailTime = 0;

module.exports = {
  getLastEmailTime: () => lastEmailTime,
  updateLastEmailTime: (time) => {
    lastEmailTime = time;
  },
};
