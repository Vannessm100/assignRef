import React, { useState } from "react";
import { Card } from "react-bootstrap";
import PropTypes from "prop-types";
import EmailLinkModal from "./EmailLinkModal";

function MeetingCard(props) {
  const newMeeting = props.meeting;

  const [showModal, setShowModal] = useState(false);

  function toggleModal() {
    setShowModal(!showModal);
  }

  return (
    <div className="col-md-6 col-sm-12">
      <Card className="p-4">
        <Card.Header className="d-flex justify-content-center">
          <p className="text-center display-5">
            <strong>Created Meeting</strong>
          </p>
        </Card.Header>
        <Card.Body>
          <div>
            <label htmlFor="topic" className="form-label">
              Created Meeting Topic
            </label>
            <input
              name="headline"
              className="form-control"
              id="meetingLink"
              placeholder="Link will be posted here when the meeting is created."
              value={newMeeting.topic}
              readOnly
            />
            <div>
              <label htmlFor="topic" className="form-label">
                Meeting Time
              </label>
              <input
                name="headline"
                className="form-control"
                id="meetingLink"
                placeholder="Link will be posted here when the meeting is created."
                value={newMeeting.startTime}
                readOnly
              />
            </div>
            <div>
              <label htmlFor="topic" className="form-label">
                Meeting Url
              </label>
              <input
                name="headline"
                className="form-control"
                id="meetingLink"
                placeholder="Link will be posted here when the meeting is created."
                value={newMeeting.joinUrl}
                readOnly
              />
              <button
                className="btn btn-dark btn-sm mt-2 me-2"
                type="submit"
                onClick={() =>
                  navigator.clipboard.writeText(newMeeting.joinUrl)
                }
              >
                Copy Link
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm mt-2"
                onClick={toggleModal}
              >
                Email Link
              </button>
            </div>
          </div>
        </Card.Body>
      </Card>
      <EmailLinkModal
        meeting={newMeeting}
        show={showModal}
        toggle={toggleModal}
      ></EmailLinkModal>
    </div>
  );
}
export default MeetingCard;
MeetingCard.propTypes = {
  meeting: PropTypes.shape({
    topic: PropTypes.string.isRequired,
    startTime: PropTypes.string.isRequired,
    joinUrl: PropTypes.string.isRequired,
  }).isRequired,
};
