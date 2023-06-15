
function SearchedMeetingCard(props) {
  const meetingData = props.meeting;

  return (
    <div className="col-md-6 col-sm-12">
      <Card className="p-4">
        <Card.Header className="d-flex justify-content-center">
          <p className="text-center display-5">
            <strong>{meetingData.topic} Information</strong>
          </p>
        </Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-md-6 col-sm-12">
              <div>
                <label htmlFor="creator" className="form-label">
                  Meeting Creator
                </label>
                <input
                  name="creator"
                  className="form-control"
                  id="creator"
                  placeholder="Link will be posted here when the meeting is created."
                  value={meetingData.userName}
                  readOnly
                />
                <label htmlFor="startTime" className="form-label">
                  Meeting Start Time
                </label>
                <input
                  name="startTime"
                  className="form-control"
                  id="startTime"
                  placeholder="Link will be posted here when the meeting is created."
                  value={formatDateTime(meetingData.startTime)}
                  readOnly
                />
                <label htmlFor="endTime" className="form-label">
                  Meeting End Time
                </label>
                <input
                  name="endTime"
                  className="form-control"
                  id="endTime"
                  placeholder="Link will be posted here when the meeting is created."
                  value={formatDateTime(meetingData.endTime)}
                  readOnly
                />
              </div>
            </div>
            <div className="col-md-6 col-sm-12">
              <div>
                <label htmlFor="meetingTime" className="form-label">
                  Total Meeting Time
                </label>
                <input
                  name="meetingTime"
                  className="form-control"
                  id="meetingTime"
                  placeholder="Link will be posted here when the meeting is created."
                  value={meetingData.duration + " " + "Minute(s)"}
                  readOnly
                />
              </div>
              <div>
                <label htmlFor="meetingParticipants" className="form-label">
                  Total Meeting Participants
                </label>
                <input
                  name="meetingParticipants"
                  className="form-control"
                  id="meetingParticipants"
                  placeholder="Link will be posted here when the meeting is created."
                  value={meetingData.participantsCount}
                  readOnly
                />
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
export default SearchedMeetingCard;
SearchedMeetingCard.propTypes = {
  meeting: PropTypes.shape({
    duration: PropTypes.number.isRequired,
    participantsCount: PropTypes.number.isRequired,
    startTime: PropTypes.string.isRequired,
    endTime: PropTypes.string.isRequired,
    userName: PropTypes.string.isRequired,
    topic: PropTypes.string.isRequired,
  }).isRequired,
};
