import React, { useEffect, useState } from "react";
import zoomService from "services/zoomService";
import debug from "sabio-debug";
import { Col, Row, Container, Card } from "react-bootstrap";
import TitleHeader from "components/general/TitleHeader";
import { formatDateTime } from "utils/dateFormater";
import SearchedMeetingCard from "./SearchedMeetingCard";
import toastr from "toastr";
import PropTypes from "prop-types";

function SeeUserMeetings({ currentUser }) {
  const [userInfo, setUserinfo] = useState({
    userId: currentUser.id,
    meetings: [],
  });
  const [showMeeting, setShowMeeting] = useState(false);
  const [searchMeeting, setSearchMeeting] = useState("");
  const [meetingData, setMeetingData] = useState("");
  const _logger = debug.extend("ZoomModal");

  useEffect(() => {
    _logger("currentUser", currentUser);
    if (userInfo.userId !== 0) {
      zoomService
        .getUserMeetings(userInfo.userId)
        .then(getUserMeetingsSuccess)
        .catch(getUserMeetingsError);
    }
  }, [userInfo.userId]);
  useEffect(() => {
    const hasToken = document.cookie.includes("hasToken");
    if (hasToken === false) {
      zoomService
        .authenticateToken()
        .then(onAuthenticateSuccess)
        .catch(onAuthenticateError);
    } else {
      toastr["success"]("Authenticated");
    }
  }, []);
  const onAuthenticateSuccess = (response) => {
    _logger("Got response", response);
    //redirects to the authentication page where the user signs into zoom
    window.location.href = response;
  };
  const onAuthenticateError = (err) => {
    _logger("Token Error", err);
    toastr["error"]("An unexpected error occured");
  };

  function mapMeetings(meeting) {
    return (
      <Container>
        <Row>
          <Col className="border">
            <h5>Meeting ID:</h5>
            {meeting.meetingId}
          </Col>
          <Col className="border">
            <h5>Start Time:</h5>
            {formatDateTime(meeting.startTime)}
          </Col>
          <Col className="border">
            <h5>Meeting Creator:</h5>
            {meeting.meetingCreator}
          </Col>
        </Row>
      </Container>
    );
  }

  const getUserMeetingsSuccess = (response) => {
    _logger("response", response);
    setUserinfo((prevState) => {
      const newState = { ...prevState };
      newState.meetings = response.items.map(mapMeetings);
      return newState;
    });
  };

  const getUserMeetingsError = (err) => {
    _logger("err", err);
  };

  function submitMeetingId() {
    _logger("searchMeeting", searchMeeting);
    zoomService
      .getZoomMeeting(searchMeeting)
      .then(getZoomMeetingSuccess)
      .catch(getZoomMeetingError);
  }
  const getZoomMeetingSuccess = (response) => {
    _logger("getZoomMeetingSuccess", response);
    setMeetingData((prevState) => {
      let newState = { ...prevState };
      newState = response.item;
      return newState;
    });
    setShowMeeting(true);
  };

  const getZoomMeetingError = (err) => {
    _logger("getZoomMeetingError", err);
    toastr["error"]("Meeting has not started");
  };

  function returnedMeeting() {
    return <SearchedMeetingCard meeting={meetingData}></SearchedMeetingCard>;
  }

  return (
    <React.Fragment>
      <div>
        <TitleHeader title="Your Meetings" />
      </div>
      <div className="row">
        <div className="col-lg-5">
          <div className="mb-4">
            <h5>Search Meeting (Meeting must have occured)</h5>
            <div className="d-flex">
              <input
                className="form-control"
                type="search"
                placeholder="Search Meeting Id"
                aria-label="Search"
                onChange={(e) => setSearchMeeting(e.target.value)}
              />
              <button
                onClick={submitMeetingId}
                className="btn btn-primary ms-2"
              >
                Search
              </button>
            </div>
          </div>
          <div>
            <Card>
              <Card.Body>{userInfo.meetings}</Card.Body>
            </Card>
          </div>
        </div>
        <div className="col-lg-7">{showMeeting && returnedMeeting()}</div>
      </div>
    </React.Fragment>
  );
}
SeeUserMeetings.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.number.isRequired,
  }).isRequired,
};
export default SeeUserMeetings;
