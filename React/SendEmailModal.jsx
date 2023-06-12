
function SendEmailModal(props) {
  const emailList = props.emailRecipient.userEmailList;
  const meeting = props.emailRecipient.meeting;
  const setEmailRecipient = props.setRec;
  const _logger = debug.extend("CreateZoomMeeting");

  function sendEmail() {
    const sendEmailList = { emailList, meeting };
    _logger("sendEmailList", sendEmailList);
    if (emailList === null) {
      toastr["error"]("An unexpected error occured");
    } else {
      zoomService
        .emailMeetingLink(sendEmailList)
        .then(onEmailMeetingSuccess)
        .catch(onEmailMeetingError);
    }
    setEmailRecipient((prevState) => {
      let resetModals = { ...prevState };
      resetModals.userEmailList = [];
      resetModals.addedUsers = [];
      return resetModals;
    });
    props.toggle();
  }

  const onEmailMeetingSuccess = (response) => {
    _logger("response", response);
    toastr["success"]("Email sent");
  };

  const onEmailMeetingError = (err) => {
    _logger("onEmailMeetingError err", err);
    toastr["error"]("Unable to send email");
  };

  function mapEmailList(singleEmail) {
    return <div key={singleEmail.email}>{singleEmail.email}</div>;
  }

  return (
    <div>
      <Modal
        className="modal-dialog-scrollable modal-sm"
        show={props.isShowing}
        onHide={props.toggle}
        centered
      >
        <Modal.Title className="text-center text-decoration-underline mt-2">
          Email List
        </Modal.Title>
        <Modal.Body
          style={{ maxHeight: "250px" }}
          className="text-center text-decoration-underline"
        >
          <div></div>

          <div>{emailList.map(mapEmailList)}</div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={props.toggle}
          >
            Close
          </button>
          <button type="button" className="btn btn-primary" onClick={sendEmail}>
            Send Email
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
export default SendEmailModal;
SendEmailModal.propTypes = {
  emailRecipient: PropTypes.shape({
    userEmailList: PropTypes.arrayOf(
      PropTypes.shape({
        email: PropTypes.string.isRequired,
      })
    ).isRequired,
    meeting: PropTypes.string.isRequired,
  }).isRequired,
  setRec: PropTypes.func.isRequired,
  isShowing: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
};
