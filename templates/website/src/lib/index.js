/**
 * Get Votes
 */

const getVotes = async () => {

  let data = await fetch(window.env.apiUrl + '/v1/votes')
  data = await data.json()

  console.log('** Votes Fetched **')
  console.log(data)

  return data
}

/**
 * Save Vote
 */

const saveVote = async () => {

  let data = await fetch(window.env.apiUrl + '/v1/votes',
    {
      method: 'POST',
      mode: 'cors'
    }
  )
  data = await data.json()

  console.log('** Votes Fetched **')
  console.log(data)

  return data
}

module.exports = {
  getVotes,
  saveVote,
}
