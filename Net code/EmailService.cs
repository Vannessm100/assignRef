
namespace Sabio.Services
{
    public class EmailService : IEmailService
    {

        private readonly AppKeys _appKeys;
        private readonly IWebHostEnvironment _webHostEnvironment;
        public IConfiguration _configuration { get; set; }
        public ILookUpService _lookupService { get; set; }
        public EmailService(IOptions<AppKeys> appKeys, IWebHostEnvironment webHostEnvironment, IConfiguration configuration, ILookUpService lookupService)
        {
            _appKeys = appKeys.Value;
            _webHostEnvironment = webHostEnvironment;
            _configuration = configuration;
            _lookupService = lookupService;
        }

   
        ///Sending Zoom Meeting Email

        public async Task ReceiveZoomMeetingRequest(EmailZoomMeeting model)
        {
            string template = StandardZoomMeetingTemplate(model.Meeting.Topic, model.Meeting.JoinUrl, model.Meeting.StartTime);
            List<SendSmtpEmail> emailList = EmailListStandardTransac(model, template);

            await SendZoomLinkEmailAsync(emailList);
        } 
        private string StandardZoomMeetingTemplate(string topic, string joinUrl, DateTime startTime)
        {
            string meetingTime = startTime.ToString();
            string emailContent = "";
            string emailBodyPath = _webHostEnvironment.WebRootPath + "/EmailTemplates/ZoomEmailMeetingBody.html";

            emailContent = File.ReadAllText(emailBodyPath).Replace("{zoomLink}", joinUrl).Replace("{topic}", topic).Replace("{startTime}", meetingTime);

            string htmlPath = Path.Combine(_webHostEnvironment.WebRootPath, "EmailTemplates/StandardTemplate.html");
            string htmlTemplate = File.ReadAllText(htmlPath)
                .Replace("{{Header}}", $"Meeting Invite to: {topic}")
                .Replace("{{Body}}", emailContent);

            return htmlTemplate;
        }

        private List<SendSmtpEmail> EmailListStandardTransac(EmailZoomMeeting model, string template)
        {
            SendSmtpEmailSender emailSender = new SendSmtpEmailSender(name: "AssignRef", email: _appKeys.SendInBlueAdminEmail);
            List<SendSmtpEmail> emailListToSend = new List<SendSmtpEmail>();

            foreach (ZoomEmailRecipient recipient in model.EmailList)
            {
                string recipientEmail = recipient.Email; 
                SendSmtpEmailTo emailTo = new SendSmtpEmailTo(email: recipientEmail);
                SendSmtpEmail email = new SendSmtpEmail(sender: emailSender, to: new List<SendSmtpEmailTo> { emailTo }, htmlContent: template, subject: "AssignRef Meeting Invite");
                emailListToSend.Add(email);
            }

            return emailListToSend;
        }

        private async Task SendZoomLinkEmailAsync(List<SendSmtpEmail> sendSmtpEmailList)
        {
            Configuration.Default.ApiKey["api-key"] = _appKeys.SendInBlueAppKey;

            TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();

            foreach (SendSmtpEmail email in sendSmtpEmailList)
            {
                await apiInstance.SendTransacEmailAsync(email);
            }
        }

        public async void SendMeetingLink(EmailZoomMeeting model)
        {
            await ReceiveZoomMeetingRequest(model);

        }

    }
}
