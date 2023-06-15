import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import TitleHeader from "components/general/TitleHeader";
import debug from "sabio-debug";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import zoomService from "services/zoomService";
import toastr from "toastr";
import { format } from "date-fns";
import zoomMeetingFormSchema from "schemas/zoomMeetingFormSchema";
import { Card } from "react-bootstrap";
import { formatDateTime } from "utils/dateFormater";
import MeetingCard from "./MeetingCard";
import PropTypes from "prop-types";

const _logger = debug.extend("CreateZoomMeeting");
function CreateZoomMeeting({ currentUser }) {
  const [userConference, setUserConference] = useState({
    conferenceId: currentUser.conferenceId,
    meetingCreator: currentUser.email,
    meetingId: 0,
    userId: currentUser.id,
    startTime: new Date(),
  });
  _logger("On Zoom Component");
  const [meetingData] = useState({
    topic: "",
    type: 2,
    duration: "",
    startTime: new Date(),
    timeZone: "",
    hostVideo: true,
    participantVideo: true,
    participants: [],
  });

  const [meetingResponse, setMeetingResponse] = useState({
    startTime: " ",
    topic: " ",
    joinUrl: " ",
  });
  const [showCreatedMeeting, setShowCreatedMeeting] = useState(false);

  function showMeeting() {
    return (
      <MeetingCard
        meeting={meetingResponse}
        conferenceId={userConference}
      ></MeetingCard>
    );
  }

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

  useEffect(() => {
    if (userConference.meetingId !== 0) {
      zoomService
        .saveMeeting(userConference)
        .then(onSaveMeetingSuccess)
        .catch(onSaveMeetingError);
    }
  }, [userConference.meetingId]);

  const onAuthenticateSuccess = (response) => {
    _logger("Got response", response);
    //redirects to the authentication page where the user signs into zoom
    window.location.href = response;
  };
  const onAuthenticateError = (err) => {
    _logger("Token Error", err);
    toastr["error"]("An unexpected error occured");
  };

  const submitMeeting = (values) => {
    _logger("submitted values:", values);
    zoomService
      .createMeeting(values)
      .then(onCreateMeetingSuccess)
      .catch(onCreateMeetingError);
  };

  const onCreateMeetingSuccess = (response) => {
    _logger("Got response response.item", response.item);
    toastr["success"]("Meeting Created");
    setUserConference((prevState) => {
      const newState = { ...prevState };
      newState.meetingId = response.item.meetingId;
      newState.startTime = response.item.startTime;
      return newState;
    });
    setMeetingResponse((prevState) => {
      const newMeeting = { ...prevState };
      newMeeting.topic = response.item.topic;
      newMeeting.joinUrl = response.item.joinUrl;
      newMeeting.startTime = formatDateTime(response.item.startTime);
      return newMeeting;
    });
    setShowCreatedMeeting(true);
  };
  const onCreateMeetingError = (err) => {
    _logger("onCreateMeetingError", err);

    toastr["error"]("An unexpected error occured");
  };

  const onSaveMeetingSuccess = (response) => {
    _logger("onSaveMeetingSuccess", response);
    _logger("userConference", userConference);
  };
  const onSaveMeetingError = (err) => {
    _logger("onSaveMeetingError", err);
    _logger("userConference", userConference);
    toastr["error"]("An unexpected error occured");
  };

  const selectHour = {
    hour: [
      { id: 1, totalHr: 1 },
      { id: 2, totalHr: 1.5 },
      { id: 3, totalHr: 2 },
      { id: 4, totalHr: 2.5 },
      { id: 5, totalHr: 3 },
      { id: 6, totalHr: 3.5 },
      { id: 7, totalHr: 4 },
      { id: 8, totalHr: 4.5 },
      { id: 9, totalHr: 5 },
    ],
  };
  function clearUrl() {
    setShowCreatedMeeting(false);
    setMeetingResponse((prevState) => {
      const clearMeeting = { ...prevState };
      clearMeeting.topic = "";
      clearMeeting.joinUrl = "";
      clearMeeting.startTime = "";
      return clearMeeting;
    });
  }

  const mapHour = (hour) => {
    return (
      <option value={hour.Id} key={`hour_${hour.Id}`}>
        {hour.totalHr}
      </option>
    );
  };

  return (
    <React.Fragment>
      <TitleHeader title="Create Zoom Meeting" />
      <div className="row">
        <div className="col-5">
          <div className="mb-3">
            <a href="/meetings/userMeetings">
              <button type="reset" className="btn btn-primary">
                Your Meetings
              </button>
            </a>
          </div>
          <Card className="p-4">
            <Card.Body>
              <div className="justify-content-center">
                <Formik
                  enableReinitialize={true}
                  initialValues={meetingData}
                  validationSchema={zoomMeetingFormSchema}
                  onSubmit={(values) => {
                    values.duration = values.duration * 60;
                    values.startTime = format(
                      values.startTime,
                      "yyyy-MM-dd'T'HH:mm:ss"
                    );
                    submitMeeting(values);
                    values.startTime = new Date();
                    values.duration = 1;
                  }}
                >
                  {({ setFieldValue, values }) => (
                    <Form>
                      <div className="row">
                        <div className="col-md-6 col-sm-12">
                          <div className="mb-3">
                            <label htmlFor="topic" className="form-label">
                              Topic
                            </label>
                            <Field
                              name="topic"
                              placeholder="Enter meeting topic"
                              type="text"
                              id="topic"
                              className="form-control"
                            />
                            <ErrorMessage
                              name="topic"
                              component="div"
                              className="text-danger"
                            />
                          </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                          <div className="mb-3">
                            <label htmlFor="duration" className="form-label">
                              Meeting Duration (in Hours)
                            </label>
                            <Field
                              component="select"
                              name="duration"
                              placeholder="Enter meeting length in minutes"
                              type="text"
                              id="duration"
                              className="form-control"
                            >
                              <option value="">Please Select</option>
                              {selectHour.hour.map(mapHour)}
                            </Field>
                            <ErrorMessage
                              name="duration"
                              component="div"
                              className="text-danger"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="mb-3 col-md-6 col-sm-12">
                          <div>
                            <label htmlFor="startTime" className="form-label">
                              Start Time
                            </label>
                          </div>
                          <DatePicker
                            selected={values.startTime}
                            onChange={(date) =>
                              setFieldValue("startTime", date)
                            }
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            placeholderText="Select start time"
                            className="form-control"
                            dateFormat="yyyy-MM-dd'T'HH:mm:ss"
                            value={formatDateTime(values.startTime)}
                          />

                          <ErrorMessage
                            name="startTime"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                        <div className="mb-3 col-md-6 col-sm-12">
                          <div>
                            <label htmlFor="timeZone" className="form-label">
                              Time Zone
                            </label>
                          </div>
                          <Field
                            component="select"
                            name="timeZone"
                            placeholder="(GMT-7:00) Pacific Time (US and Canada)"
                            type="text"
                            id="timeZone"
                            className="form-control"
                          >
                            <option value="">
                              Please Select Your Time Zone
                            </option>
                            <option value="America/Los_Angeles">
                              (GMT-7:00) Pacific Time (US and Canada)
                            </option>
                            <option value="America/Denver">
                              (GMT-6:00) Mountain Time (US and Canada)
                            </option>
                            <option value="America/Chicago">
                              (GMT-5:00) Central Time (US and Canada)
                            </option>
                            <option value="America/New_York">
                              (GMT-4:00) Eastern Time (US and Canada)
                            </option>
                            <option value="UTC">
                              (GMT+0:00) Universal Time UTC
                            </option>
                          </Field>
                          <ErrorMessage
                            name="timeZone"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                      </div>
                      <div className="my-5">
                        <button className="btn btn-dark me-2" type="submit">
                          Submit
                        </button>
                        <button
                          type="reset"
                          className="btn btn-danger"
                          onClick={clearUrl}
                        >
                          Clear All
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </Card.Body>
          </Card>
        </div>
        {showCreatedMeeting && showMeeting()}
      </div>
    </React.Fragment>
  );
}
CreateZoomMeeting.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.number.isRequired,
    conferenceId: PropTypes.number.isRequired,
    email: PropTypes.string.isRequired,
  }).isRequired,
};
export default CreateZoomMeeting;
