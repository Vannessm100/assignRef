
namespace Sabio.Services
{


    public class ZoomService : IZoomService
    {
        private IRestClient _restClient;
        private ZoomConfig _zoomConfig;



        public ZoomService(IRestClient restClient, IOptions<ZoomConfig> zoomConfig)
        {
            _restClient = restClient;
            _zoomConfig = zoomConfig.Value;

        }


        public string GetAuthenticationCode()
        {
        
            var clientId = _zoomConfig.ClientId;
            var redirectUri = _zoomConfig.RedirectUrl;
            var authorizationUrl = $"https://zoom.us/oauth/authorize?response_type=code&client_id={clientId}&redirect_uri={redirectUri}";
            return authorizationUrl;
        }

        public async Task<string> GetToken([FromBody] string code)
        {
            string authorizationCode = GetAuthenticationCode();
            var clientSecret = _zoomConfig.ClientSecret;
            var clientId = _zoomConfig.ClientId;

            var clientSecretId = $"{clientId}:{clientSecret}";
            byte[] byt = Encoding.UTF8.GetBytes(clientSecretId);
            var encodedId = Convert.ToBase64String(byt);
            var redirectUri = "https://localhost:50001/api/zoom/token";
            var request = new RestRequest("https://zoom.us/oauth/token", Method.Post);
            request.AddHeader("Authorization", "Basic " + $"{encodedId}");
            request.AddHeader("content-type", "application/x-www-form-urlencoded");
            request.AddParameter("code", code, ParameterType.GetOrPost );
            request.AddParameter("grant_type", "authorization_code", ParameterType.GetOrPost);
            request.AddParameter("redirect_uri", redirectUri, ParameterType.GetOrPost);
            var response = await _restClient.ExecuteAsync<ZoomTokenResponse>(request);

            if (response.IsSuccessful == false)
            {
                throw new Exception($"Failed to retrieve access token: {response.ErrorMessage}");
            }

            var jsonResponse = JObject.Parse(response.Content);
            var accessToken = jsonResponse["access_token"].Value<string>();

            return accessToken;
        }

        public async Task<ZoomUser> GetUser(string accessToken) 
        {

            if (accessToken != null)
            {
                var options = new RestClientOptions("https://api.zoom.us")
                {
                    MaxTimeout = -1,
                };
                var client = new RestClient(options);
                var request = new RestRequest("/v2/users/me?login_type=1&encrypted_email=false&search_by_unique_id=<boolean>", Method.Get);
                request.AddHeader("Accept", "application/json");
                request.AddHeader("Authorization", $"Bearer {accessToken}");
                RestResponse response = await client.ExecuteAsync(request);
                JObject jsonResponse = JObject.Parse(response.Content);
                var user = new ZoomUser
                {
                    Id = jsonResponse["id"].Value<string>(),
                    FirstName = jsonResponse["first_name"].Value<string>(),
                    LastName = jsonResponse["last_name"].Value<string>(),
                    Email = jsonResponse["email"].Value<string>(),
                };

                return user; 
            }
            else
            {

                throw new Exception("Invalid token");
            }

        }
        public async Task<ZoomMeeting> CreateZoomMeeting(string accessToken, ZoomMeetingAddRequest model)
        {
           
            if (accessToken != null)
            {
                var options = new RestClientOptions("https://api.zoom.us")
                {
                    MaxTimeout = -1,
                };
                var client = new RestClient(options);
                var request = new RestRequest("/v2/users/me/meetings", Method.Post);
                request.AddHeader("Content-Type", "application/json");
                request.AddHeader("Accept", "application/json");
                request.AddHeader("Authorization", $"Bearer {accessToken}");
                request.RequestFormat = DataFormat.Json;
                request.AddJsonBody(model);
      


                RestResponse response = await client.ExecuteAsync(request);
                var jsonResponse = JsonConvert.DeserializeObject<dynamic>(response.Content);
             
                if (response.StatusCode == HttpStatusCode.Created)
                {
                    var meeting = new ZoomMeeting
                    {
                        StartTime = jsonResponse.start_time,
                        JoinUrl = jsonResponse.join_url,
                        Topic = jsonResponse.topic,
                        
                    };
                    return meeting;
                }
                else
                {
                    throw new Exception("Failed to create Zoom meeting");
                }
            }
            else
            {
                throw new Exception("Invalid token"); 
            }
        }

    }
}

 
