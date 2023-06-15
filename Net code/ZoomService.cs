namespace Sabio.Services
{
    public class ZoomService : IZoomService
    {
        private IRestClient _restClient;
        private ZoomConfig _zoomConfig;
        IDataProvider _data = null;



        public ZoomService(IRestClient restClient, IOptions<ZoomConfig> zoomConfig, IDataProvider data)
        {
            _restClient = restClient;
            _zoomConfig = zoomConfig.Value;
            _data = data;

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
            var redirectUri = _zoomConfig.RedirectUrl;
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
                        MeetingCreator = jsonResponse.host_email,
                        MeetingId = jsonResponse.id,
                        
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
        public int Add(BaseMeeting model)
        {

            int id = 0;

            string procName = "[dbo].[Meetings_Insert]";
            _data.ExecuteNonQuery(procName,
             inputParamMapper: delegate (SqlParameterCollection col)

             {
                 AddCommonParams(model, col);


               
                 SqlParameter idOut = new SqlParameter("@Id", SqlDbType.Int);
                 idOut.Direction = ParameterDirection.Output;

                 col.Add(idOut);

             }, returnParameters: delegate (SqlParameterCollection returnCollection)
             {
                 object oId = returnCollection["@Id"].Value;
                 int.TryParse(oId.ToString(), out id);

             });

            return id;
        }
     

        public List<UserMeetingRequest> GetById(int id)
        {
            List<UserMeetingRequest> list = null;
            string procName = "[dbo].[Meetings_SelectById]";

            _data.ExecuteCmd(procName, delegate (SqlParameterCollection parameterCollection)
            {
                parameterCollection.AddWithValue("@Id", id);

            }, singleRecordMapper: delegate (IDataReader reader, short set)
            {
                int index = 0;
                UserMeetingRequest message = MapSingleMeeting(reader, ref index);

                if (list == null)
                {
                    list = new List<UserMeetingRequest>();
                }

                list.Add(message);
            });

            return list;
        }

        public async Task<MeetingInformationRequest> GetMeeting(string accessToken, long meetingId)
        {

            if (accessToken != null)
            {
                var options = new RestClientOptions("https://api.zoom.us")
                {
                    MaxTimeout = -1,
                };
                var client = new RestClient(options);
                var request = new RestRequest($"/v2/past_meetings/{meetingId}", Method.Get);
                request.AddHeader("Accept", "application/json");
                request.AddHeader("Authorization", $"Bearer {accessToken}");
                RestResponse response = await client.ExecuteAsync(request);
                JObject jsonResponse = JObject.Parse(response.Content);
                var meeting = new MeetingInformationRequest
                {
                    Topic = jsonResponse["topic"].Value<string>(),
                    UserName = jsonResponse["user_name"].Value<string>(),
                    StartTime = jsonResponse["start_time"].Value<DateTime>(),
                    EndTime = jsonResponse["end_time"].Value<DateTime>(),
                    Duration = jsonResponse["duration"].Value<int>(),
                    ParticipantsCount = jsonResponse["participants_count"].Value<int>(),
                };

                return meeting;
            }
            else
            {

                throw new Exception("Invalid token");
            }

        }


        private static void AddCommonParams(BaseMeeting model, SqlParameterCollection col)
        {
            col.AddWithValue("@MeetingId", model.MeetingId);
            col.AddWithValue("@MeetingCreator", model.MeetingCreator);
            col.AddWithValue("@UserId", model.UserId);
            col.AddWithValue("@StartTime", model.StartTime);
        }

        private static UserMeetingRequest MapSingleMeeting(IDataReader reader, ref int index)
        {
            UserMeetingRequest meeting = new UserMeetingRequest();

            meeting.Id = reader.GetSafeInt32(index++);
            meeting.MeetingId = reader.GetSafeInt64(index++);
            meeting.StartTime = reader.GetDateTime(index++);
            meeting.MeetingCreator = reader.GetSafeString(index++);
            meeting.UserId = reader.GetSafeInt32(index++);
            meeting.FirstName = reader.GetSafeString(index++);
            meeting.LastName = reader.GetSafeString(index++);
     
            return meeting;
        }
    }
}

 
