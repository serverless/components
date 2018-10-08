const Info = {
  async run(context) {
    // TODO BRN (priority high): load the last deployment and construct/define based on previous state
    // Execute a walkReduceComponents against the entire component tree. Give each component an opportunity to execute an info method. Each info method should return an object where the key is the category of how the info should be organized and the value is an item to output for that category

    // merge and then sort based on category names

    // context.log
    // [category name]
    // [item 1]
    // [item 2]

    context.log('TODO: implement info command')

    return context
  }
}

export default Info
