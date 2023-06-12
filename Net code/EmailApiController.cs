
namespace Sabio.Web.Api.Controllers
{
    [Route("api/emails")]
    [ApiController]
    public class EmailApiController : BaseApiController
    {
        private IEmailService _service = null;
        public EmailApiController(IEmailService service,
            ILogger<EmailApiController> logger) : base(logger)
        {
            _service = service;
        }

        [HttpPost("emailZoomLink")]
        public ActionResult<SuccessResponse> SendZoomLinkEmail(EmailZoomMeeting model)
        {
            int code = 200;
            BaseResponse response = null;

            try
            {
               _service.SendMeetingLink(model);

                response = new SuccessResponse();
            }
            catch (Exception ex)
            {
                code = 500;
                response = new ErrorResponse(ex.Message);
            }

            return StatusCode(code, response);



            
        }
    }


}
