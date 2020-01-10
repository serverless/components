const airports = [
  {
    code: "YYZ",
    name: "Toronto Pearson International Airport",
    location: "Ontario, Canada"
  },
  {
    code: "YUL",
    name: "Montréal-Pierre Elliott Trudeau International Airport",
    location: "Québec, Canada"
  }
];

module.exports.handler = async event => {
  console.log(`Fetching Airport Code "${event.code}"`);

  const airport = airports.find(airport => airport.code === event.code);

  console.log(JSON.stringify(airport, null, 4));

  return airport;
};
