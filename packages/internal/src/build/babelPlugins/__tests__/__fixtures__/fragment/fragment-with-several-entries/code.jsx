const VoteButtons = (props) => {
  return (
    <div>{JSON.stringify(props)}</div>
  )
}

VoteButtons.fragments = {
  entry: gql`
    fragment VoteButtonsFragment on FeedEntry {
      score
      vote {
        choice
      }
    }
  `,
  voter: gql`
    fragment VoterFragment on FeedEntry {
      voter {
        id
        name
      }
    }
  `,
};

export default VoteButtons
