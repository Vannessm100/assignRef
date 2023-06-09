
namespace Sabio.Web.Api.Controllers
{
    namespace Sabio.Web.Api.Controllers
    {
        [Route("api/zoom")]
        [ApiController]
        public class ZoomApiController : BaseApiController
        {
            public IZoomService _service { get; set; }
         

            private IAuthenticationService<int> _authService = null;
            private ZoomConfig _zoomConfig;

            public ZoomApiController(IZoomService service, ILogger<ZoomApiController> logger, IOptions<ZoomConfig> zoomConfig, IAuthenticationService<int> authService) : base(logger)
            {

                _service = service;
                _authService = authService;
                _zoomConfig = zoomConfig.Value;
                var clientSecret = _zoomConfig.ClientSecret;
                var clientId = _zoomConfig.ClientId;
            }



            [HttpGet("authenticate")]
            public ActionResult<string> GetAuth()
            {
                int code = 302;
                BaseResponse response = null;

                try
                {
                    string authUrl = _service.GetAuthenticationCode();

                    if (authUrl == null)
                    {
                        code = 404;
                        response = new ErrorResponse("Improper Authorization");
                    }
                    else
                    {

                        return authUrl;
                    }
                }
                catch (Exception ex)
                {
                    code = 500;
                    response = new ErrorResponse(ex.Message);
                    base.Logger.LogError(ex.ToString());
                }

                return StatusCode(code, response);


            }

            [HttpGet("token")]
            public async Task<ActionResult<ItemResponse<string>>> GetAuthToken(string code)
            {
                int responseCode = 200;
                BaseResponse response = null;

                try
                {
                    string accessToken = await _service.GetToken(code);
                    string hasToken = "true";

                    if (accessToken == null)
                    {
                        responseCode = 404;
                        response = new ErrorResponse("No token");
                    }
                    else
                    {

                        var accessTokenCookieOptions = new CookieOptions
                        {

                            Secure = true,
                            MaxAge = TimeSpan.FromMinutes(60),
                            HttpOnly = true,
                            SameSite = SameSiteMode.None,
                            IsEssential = true,

                        };
                        var hasTokenCookieOptions = new CookieOptions
                        {

                            Secure = true,
                            MaxAge = TimeSpan.FromMinutes(60),

                        };

                        Response.Cookies.Append("accessToken", accessToken, accessTokenCookieOptions);
                        Response.Cookies.Append("hasToken", hasToken, hasTokenCookieOptions);
                        response = new ItemResponse<string> { Item = accessToken };
                        //link for testing purposes
                        return Redirect(_zoomConfig.ReturnUrl);

                    }
                }
                catch (Exception ex)
                {
                    responseCode = 500;
                    response = new ErrorResponse(ex.Message);
                    base.Logger.LogError(ex.ToString());
                }
                return StatusCode(responseCode, response);

            }


            [HttpGet("user")]
            public async Task<ActionResult<ItemResponse<ZoomUser>>> GetCurrentUser()

            {
                int responseCode = 200;
                BaseResponse response = null;

                try
                {


                    string accessToken = Request.Cookies["accessToken"];
                    ZoomUser user = await _service.GetUser(accessToken);

                    if (accessToken == null || accessToken.Length < 1)
                    {
                        responseCode = 404;
                        response = new ErrorResponse("No token");

                    }
                    else
                    {
                        response = new ItemResponse<ZoomUser> { Item = user };
                    }
                }
                catch (Exception ex)
                {
                    responseCode = 500;
                    response = new ErrorResponse(ex.Message);
                    base.Logger.LogError(ex.ToString());
                }

                return StatusCode(responseCode, response);
            }

            [HttpPost("meeting")]
            public async Task<ActionResult<ItemResponse<ZoomMeeting>>> CreateMeeting(ZoomMeetingRequest model)
            {

                ZoomMeetingAddRequest request = new ZoomMeetingAddRequest();

                request.topic = model.Topic;
                request.start_time = model.StartTime;
                request.type = model.Type;
                request.duration = model.Duration;
                request.timezone = model.Timezone;
                request.hostvideo = model.HostVideo;
                request.participantvideo = model.ParticipantVideo;



                int responseCode = 200;
                BaseResponse response = null;

                try
                {


                    string accessToken = Request.Cookies["accessToken"];
                    ZoomMeeting meeting = await _service.CreateZoomMeeting(accessToken, request);


                    if (accessToken == null || accessToken.Length < 1)
                    {

                        responseCode = 401;
                    }
                    else
                    {
                        response = new ItemResponse<ZoomMeeting> { Item = meeting };
                    }
                }
                catch (Exception ex)
                {
                    responseCode = 500;
                    response = new ErrorResponse(ex.Message);
                    base.Logger.LogError(ex.ToString());
                }

                return StatusCode(responseCode, response);
            }
            [HttpPost("saveMeeting")]
            public ActionResult<ItemResponse<int>> SaveMeeting(BaseMeeting model)
            {
                ObjectResult result = null;

                try
                {
                    int id = _service.Add(model);

                    ItemResponse<int> response = new ItemResponse<int>();

                    response.Item = id;


                    result = Created201(response);

                }
                catch (Exception ex)
                {

                    Logger.LogError(ex.ToString());
                    ErrorResponse response = new ErrorResponse(ex.Message);

                    result = StatusCode(500, response);
                }
                return result;
            }

            [HttpGet("getUserMeetings/{id:int}")]
            public ActionResult<ItemResponse<UserMeetingRequest>> GetById(int id)
            {
                int code = 200;
                BaseResponse response = null;

                try
                {
                    List<UserMeetingRequest> meetings = _service.GetById(id);

                    if (meetings == null)
                    {
                        code = 404;
                        response = new ErrorResponse("Application Resource not found.");

                    }
                    else
                    {
                        response = new ItemsResponse<UserMeetingRequest> { Items = meetings };
                    }
                }
                catch (Exception ex)
                {

                    code = 500;
                    Logger.LogError(ex.ToString());
                    response = new ErrorResponse($"Generic Error: {ex.Message}");
                }

                return StatusCode(code, response);
            }

            [HttpGet("pastMeetings/{meetingId:long}")]
            public async Task<ActionResult<ItemResponse<MeetingInformationRequest>>> GetZoomMeeting(long meetingId)

            {
                int responseCode = 200;
                BaseResponse response = null;

                try
                {


                    string accessToken = Request.Cookies["accessToken"];
                    MeetingInformationRequest meeting = await _service.GetMeeting(accessToken, meetingId);

                    if (accessToken == null || accessToken.Length < 1)
                    {
                        responseCode = 404;
                        response = new ErrorResponse("No token");

                    }
                    else
                    {
                        response = new ItemResponse<MeetingInformationRequest> { Item = meeting };
                    }
                }
                catch (Exception ex)
                {
                    responseCode = 500;
                    response = new ErrorResponse(ex.Message);
                    base.Logger.LogError(ex.ToString());
                }

                return StatusCode(responseCode, response);
            }


        }
    }
}
