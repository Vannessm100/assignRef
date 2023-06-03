import React, { useState, useRef } from "react";
import { Modal, Form, Collapse, ListGroup } from "react-bootstrap";
import PropTypes from "prop-types";
import debug from "sabio-debug";
import userService from "services/userService";
import { Avatar } from "../dashboard/chat/Avatar";
import { XLg } from "react-bootstrap-icons";
import SimpleBar from "simplebar-react";
import zoomService from "services/zoomService";
import toastr from "toastr";

function EmailLinkModal(props) {
  props.meeting.startTime = new Date(props.meeting.startTime);

  const [searchResults, setSearchResults] = useState({
    results: [],
    noResult: false,
    open: false,
  });
  const searchInputRef = useRef("");
  const _logger = debug.extend("ZoomModal");
  const [emailRecipient, setEmailRecipient] = useState({
    emailList: [
      {
        firstName: "{{firstName}}",
        lastName: "{{lastName}}",
        email: "{{email}}",
      },
    ],
    meeting: props.meeting,
    addedUsers: [],
  });

  function sendEmailList() {
    const emailList = emailRecipient.emailList;
    const meeting = emailRecipient.meeting;
    const updatedRecipient = { emailList, meeting };
    _logger("addedUsers", emailRecipient.addedUsers);
    if (emailRecipient.emailList === null) {
      toastr["error"]("An unexpected error occured");
    } else {
      zoomService
        .emailMeetingLink(updatedRecipient)
        .then(onEmailMeetingSuccess)
        .catch(onEmailMeetingError);
    }
  }

  const onEmailMeetingSuccess = (response) => {
    _logger("response", response);
    toastr["success"]("Email sent");
  };

  const onEmailMeetingError = (err) => {
    _logger("onEmailMeetingError err", err);
  };

  const handleEnterDown = (event) => {
    const searchInput = searchInputRef.current.value;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(searchInput);
    }
  };
  const handleSubmit = (searchInput) => {
    _logger("Submitted search", searchInput);
    userService
      .searchUsers(searchInput, 0, 100)
      .then(onUserSearchSuccess)
      .catch(onUserSearchError);
  };
  const onUserSearchSuccess = (response) => {
    _logger("Returned search", response.item.pagedItems);
    setSearchResults((prevState) => {
      let results = { ...prevState };
      results.open = true;
      results.results = response.item.pagedItems;
      results.noResult = false;
      return results;
    });
  };

  const onUserSearchError = () => {
    setSearchResults((prevState) => {
      let results = { ...prevState };
      results.noResult = true;
      return results;
    });
  };

  const onSearchItemClicked = (incomingItem) => {
    _logger("Search item clicked", incomingItem);
    if (!emailRecipient.addedUsers.includes(incomingItem)) {
      setEmailRecipient((prevState) => {
        let newRec = { ...prevState };
        newRec.emailList = [
          ...emailRecipient.emailList,
          {
            firstName: incomingItem.firstName,
            lastName: incomingItem.lastName,
            email: incomingItem.email,
          },
        ];
        newRec.addedUsers = [...emailRecipient.addedUsers, incomingItem];
        return newRec;
      });
    }
  };

  function removeRecipient(incomingItem) {
    _logger("DeleteItem", incomingItem);

    setEmailRecipient((prevState) => {
      let newRec = { ...prevState };
      newRec.addedUsers = emailRecipient.addedUsers.filter(
        (recipient) => recipient !== incomingItem
      );
      newRec.emailList = emailRecipient.emailList.filter(
        (recipient) => recipient.email !== incomingItem.email
      );
      return newRec;
    });
  }

  return (
    <div>
      <Modal
        className="modal-dialog-scrollable"
        show={props.show}
        onHide={props.toggle}
      >
        <Modal.Header closeButton>
          <Modal.Title>Send Meeting Link</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-sm-9">
              <div>
                <div className="col-8 col-sm-10">
                  <h5 className="mb-0 fw-bold">Search Users:</h5>{" "}
                  <div className="mt-4">
                    <Form.Control
                      type="search"
                      id="search"
                      className="form-control form-control-sm"
                      ref={searchInputRef}
                      onKeyDown={handleEnterDown}
                      placeholder="Search people"
                    />
                  </div>
                  {searchResults.noResult ? (
                    <div>Unable to find anyone with that name.</div>
                  ) : (
                    <></>
                  )}
                  <div className="justify-content-between align-items-center mb-5 h-100">
                    <Collapse in={searchResults.open}>
                      <div className="border" id="search results">
                        <div className="ml-auto p-2" id="close-search-results">
                          <XLg
                            onClick={() =>
                              setSearchResults((prevState) => ({
                                ...prevState,
                                open: false,
                              }))
                            }
                          ></XLg>
                        </div>
                        <SimpleBar style={{ maxHeight: "200px" }}>
                          <ListGroup
                            bsPrefix="list-unstyled"
                            as="ul"
                            className="contacts-list"
                          >
                            {searchResults.results.map((item, index) => {
                              return (
                                <ListGroup.Item
                                  as="li"
                                  bsPrefix=" "
                                  key={index}
                                  role="button"
                                  className="py-3 px-4 contacts-item"
                                >
                                  <div
                                    className="d-flex justify-content-between align-items-center"
                                    onClick={() => onSearchItemClicked(item)}
                                  >
                                    <div className="d-flex">
                                      <Avatar
                                        size="md"
                                        className="rounded-circle"
                                        type={
                                          item.avatarUrl ? "image" : "initial"
                                        }
                                        src={item.avatarUrl}
                                        alt={item.firstName}
                                        name={item.firstName}
                                      />
                                      <div className=" ms-2">
                                        <h5 className="mb-0 fw-bold">
                                          {" "}
                                          {item.firstName} {item.lastName}
                                        </h5>
                                      </div>
                                    </div>
                                  </div>
                                </ListGroup.Item>
                              );
                            })}
                          </ListGroup>
                        </SimpleBar>{" "}
                      </div>
                    </Collapse>
                  </div>
                </div>

                <div className="col-4 col-sm-6">
                  <h5 className="mb-0 fw-bold">Send To:</h5>{" "}
                  {emailRecipient.addedUsers.map((item, index) => {
                    return (
                      <ListGroup.Item
                        as="li"
                        bsPrefix=" "
                        key={index}
                        role="button"
                        className="py-3 px-4 contacts-item"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex">
                            <Avatar
                              size="md"
                              className="rounded-circle"
                              type={item.avatarUrl ? "image" : "initial"}
                              src={item.avatarUrl}
                              alt={item.firstName}
                              name={item.firstName}
                            />
                            <div className=" ms-2">
                              <h5 className="mb-0 fw-bold">
                                {" "}
                                {item.firstName} {item.lastName}
                              </h5>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-close"
                            aria-label="Close"
                            onClick={() => removeRecipient(item)}
                          ></button>
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={props.toggle}
          >
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={sendEmailList}
          >
            Send Email
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
export default EmailLinkModal;
EmailLinkModal.propTypes = {
  toggle: PropTypes.func.isRequired,
  show: PropTypes.isBool,
  meeting: PropTypes.obj,
};
