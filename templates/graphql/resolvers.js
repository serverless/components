const Query = {
  // resolver for field getPost in type Query
  getPost: async ({ id }) => {
    return { id };
  },
};

const Mutation = {
  // resolver for field createPost in type Mutation
  createPost: async ({ id }) => {
    return { id };
  },
};

module.exports = { Query, Mutation };
