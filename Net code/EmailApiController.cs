using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Sabio.Models.AppSettings;
using Sabio.Models.Domain.Emails;
using Sabio.Models.Requests.Zoom;
using Sabio.Services;
using Sabio.Services.Interfaces;
using Sabio.Web.Controllers;
using Sabio.Web.Models.Responses;
using sib_api_v3_sdk.Model;
using System;
using System.Collections.Generic;

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
