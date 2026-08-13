const indeed = {
  name: "Indeed",

  async search({ keyword, location }) {
    console.log(`Indeed search: ${keyword} - ${location}`);

    return [];
  }
};

export default indeed;