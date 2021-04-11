const schema = {
  properties: {
    body: {
      type: "string",
      minLength: 1,
      // prettier-ignore
      pattern: "\=$"
    }
  },
  required: ["body"]
};

export default schema;
