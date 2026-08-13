const linkedin = {
  name: "LinkedIn",

  async search({ keyword, location }) {
    console.log(`LinkedIn search: ${keyword} - ${location}`);

    return [];
  }
};

export default linkedin;