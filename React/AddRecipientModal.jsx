

function AddRecipientModal(props) {
  props.meeting.startTime = new Date(props.meeting.startTime);

  const [searchResults, setSearchResults] = useState({
    results: [],
    noResult: false,
    open: false,
  });
  const [showEmailModal, setEmailShowModal] = useState(false);
  const searchInputRef = useRef("");
  const _logger = debug.extend("ZoomModal");
  const [emailRecipient, setEmailRecipient] = useState({
    userEmailList: [],
    meeting: props.meeting,
    addedUsers: [],
  });
  const [conferenceData, setConferenceData] = useState({
    conferences: [],
    componentList: [],
    selectedConference: [],
  });
  const handleOutsideSearchClick = (event) => {
    const searchInput = searchInputRef.current;
    if (searchInput && !searchInput.contains(event.target)) {
      setSearchResults((prevState) => ({
        ...prevState,
        open: false,
      }));
    }
  };

  useEffect(() => {
    conferencesService
      .getAll()
      .then(onConferencesGetAllSuccess)
      .catch(onConferencesGetAllError);
  }, []);
  const onConferencesGetAllSuccess = (response) => {
    _logger("onConferencesGetAllSuccess response", response.items);

    setConferenceData((prevState) => {
      const newState = { ...prevState };
      newState.conferences = response.items;
      newState.componentList = response.items.map(mapConferences);
      return newState;
    });
  };

  function filterEmails(singleEmail) {
    let result = false;

    if (
      emailRecipient.addedUsers.some((item) => item.email === singleEmail.email)
    ) {
      result = true;
    } else {
      result = false;
    }
    return result;
  }

  function toggleModal() {
    setEmailShowModal(!showEmailModal);
    if (
      emailRecipient.userEmailList.length >= 1 &&
      emailRecipient.addedUsers.length >= 1
    ) {
      setEmailRecipient((prevState) => {
        let resetConference = { ...prevState };
        let updatedUserEmailList =
          resetConference.userEmailList.filter(filterEmails);
        resetConference.userEmailList = updatedUserEmailList;
        return resetConference;
      });
    }
  }

  const onConferencesGetAllError = (error) => {
    _logger("error", error);
    toastr["error"]("No conferences found");
  };

  function setEmailList() {
    for (let i = 0; i < conferenceData.selectedConference.length; i++) {
      const conferenceId = conferenceData.selectedConference[i];
      officialsService
        .getByConferenceId(conferenceId)
        .then(getByConferenceIdSuccess)
        .catch(getByConferenceIdError);
    }
    setEmailShowModal(true);
  }

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
        newRec.userEmailList = [
          ...emailRecipient.userEmailList,
          { email: incomingItem.email },
        ];
        newRec.addedUsers = [...emailRecipient.addedUsers, incomingItem];
        return newRec;
      });
    }
  };

  function mapConferences(conference) {
    return (
      <div className="form-check mt-2">
        <input
          className="form-check-input"
          type="checkbox"
          value={conference.id}
          id={conference.code}
          onChange={onCheckBoxSelect}
        ></input>
        <label className="form-check-label" htmlFor={conference.code}>
          {conference.name}
        </label>
      </div>
    );
  }

  function removeRecipient(incomingItem) {
    _logger("DeleteItem", incomingItem);

    setEmailRecipient((prevState) => {
      let newRec = { ...prevState };
      newRec.addedUsers = emailRecipient.addedUsers.filter(
        (recipient) => recipient !== incomingItem
      );
      newRec.userEmailList = emailRecipient.userEmailList.filter(
        (recipient) => recipient.email !== incomingItem.email
      );
      return newRec;
    });
  }

  const onCheckBoxSelect = (e) => {
    const { value, checked } = e.target;

    setConferenceData((prevState) => {
      let newRec = { ...prevState };
      if (checked) {
        newRec.selectedConference = [...newRec.selectedConference, value];
      } else {
        newRec.selectedConference = newRec.selectedConference.filter(
          (item) => item !== value
        );
      }
      return newRec;
    });
  };

  const getByConferenceIdSuccess = (response) => {
    _logger("response", response);
    setEmailRecipient((prevState) => {
      let newRec = { ...prevState };
      for (let i = 0; i < response.items.length; i++) {
        const email = response.items[i].email;
        if (!newRec.userEmailList.some((item) => item.email === email)) {
          newRec.userEmailList.push({ email });
        }
      }
      return newRec;
    });
  };

  const getByConferenceIdError = (err) => {
    _logger("err", err);
  };

  return (
    <div onClick={handleOutsideSearchClick}>
      <Modal
        className="modal-dialog-scrollable modal-lg"
        show={props.isShowing}
        onHide={props.toggle}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Select Attendees</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "550px" }}>
          <div className="row">
            <div className="col-sm-5">
              <h5 className="mb-0 fw-bold">Select Conference:</h5>{" "}
              {conferenceData.componentList}
            </div>
            <div className="col-sm-7">
              <div className="col">
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
            onClick={setEmailList}
          >
            Confirm Email List
          </button>
        </Modal.Footer>
        {showEmailModal && (
          <SendEmailModal
            emailRecipient={emailRecipient}
            conferenceRecipient={conferenceData}
            isShowing={showEmailModal}
            toggle={toggleModal}
            setRec={setEmailRecipient}
          ></SendEmailModal>
        )}
      </Modal>
    </div>
  );
}
export default AddRecipientModal;
AddRecipientModal.propTypes = {
  toggle: PropTypes.func.isRequired,
  isShowing: PropTypes.bool.isRequired,
  meeting: PropTypes.obj,
};
