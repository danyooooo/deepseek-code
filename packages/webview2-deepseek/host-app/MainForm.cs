using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace QwenCode.WebView2
{
    /// <summary>
    /// Main form hosting the WebView2 DeepSeek chat
    /// </summary>
    public partial class MainForm : Form
    {
        private WebView2 webView;
        private ToolApiServer? toolApiServer;
        private CancellationTokenSource? cancellationTokenSource;
        private readonly HttpClient httpClient = new();
        private readonly string webviewPath;
        private readonly JObject settings;

        public MainForm()
        {
            // Load settings
            var settingsPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "appsettings.json");
            settings = LoadSettings(settingsPath);

            webviewPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "webview", "index.html");
            if (!File.Exists(webviewPath))
            {
                webviewPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "webview", "index.html");
            }

            InitializeComponent();
            InitializeWebView();
            InitializeToolApiServer();
        }

        private JObject LoadSettings(string path)
        {
            try
            {
                var content = File.ReadAllText(path);
                return JObject.Parse(content);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to load settings: {ex.Message}", "Error", 
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
                return new JObject();
            }
        }

        private void InitializeComponent()
        {
            this.SuspendLayout();
            
            // MainForm
            this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 15F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(
                settings["Window"]?["Width"]?.Value<int>() ?? 1200,
                settings["Window"]?["Height"]?.Value<int>() ?? 800
            );
            this.Name = "MainForm";
            this.Text = settings["Window"]?["Title"]?.Value<string>() ?? "DeepSeek Chat - Qwen Code Tools";
            
            this.ResumeLayout(false);
        }

        private async void InitializeWebView()
        {
            webView = new WebView2
            {
                Dock = DockStyle.Fill
            };

            this.Controls.Add(webView);

            try
            {
                // Initialize WebView2
                var env = await CoreWebView2Environment.CreateAsync(null, 
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "WebView2Cache"));
                await webView.EnsureCoreWebView2Async(env);

                // Set up message handling
                webView.CoreWebView2.WebMessageReceived += CoreWebView2_WebMessageReceived;
                webView.CoreWebView2.AddHostObjectToScript("host", new HostObject(this));

                // Load HTML
                var html = await File.ReadAllTextAsync(webviewPath);
                webView.CoreWebView2.NavigateToString(html);

                // Inject settings
                await InjectSettings();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"WebView2 initialization failed: {ex.Message}", "Error",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private async Task InjectSettings()
        {
            var deepSeekSettings = settings["DeepSeek"];
            var toolApiSettings = settings["ToolApi"];

            var script = $@"
                if (window.settingsInjected !== true) {{
                    window.settingsInjected = true;
                    
                    // Pre-fill settings from config
                    const apiKeyInput = document.getElementById('api-key');
                    const apiUrlInput = document.getElementById('api-base-url');
                    const modelInput = document.getElementById('model-name');
                    
                    if (apiKeyInput && '{deepSeekSettings?["ApiKey"]?.Value<string>()}' !== '') {{
                        apiKeyInput.value = '{deepSeekSettings?["ApiKey"]?.Value<string>()}';
                        localStorage.setItem('deepseek_api_key', '{deepSeekSettings?["ApiKey"]?.Value<string>()}');
                    }}
                    
                    if (apiUrlInput) {{
                        apiUrlInput.value = 'http://localhost:{toolApiSettings?["Port"]?.Value<int>() ?? 3456}';
                        localStorage.setItem('tool_api_url', 'http://localhost:{toolApiSettings?["Port"]?.Value<int>() ?? 3456}');
                    }}
                    
                    if (modelInput && '{deepSeekSettings?["Model"]?.Value<string>()}' !== '') {{
                        modelInput.value = '{deepSeekSettings?["Model"]?.Value<string>()}';
                        localStorage.setItem('deepseek_model', '{deepSeekSettings?["Model"]?.Value<string>()}');
                    }}
                }}
            ";

            await webView.CoreWebView2.ExecuteScriptAsync(script);
        }

        private async void InitializeToolApiServer()
        {
            try
            {
                // Start tool API server in background
                cancellationTokenSource = new CancellationTokenSource();
                
                var workspacePath = settings["ToolApi"]?["WorkspacePath"]?.Value<string>() ?? 
                    Environment.CurrentDirectory;
                var port = settings["ToolApi"]?["Port"]?.Value<int>() ?? 3456;

                toolApiServer = new ToolApiServer(workspacePath, port);
                var actualPort = await toolApiServer.StartAsync(cancellationTokenSource.Token);

                Console.WriteLine($"Tool API server started on port {actualPort}");

                // Update WebView with actual port
                var script = $@"
                    if (window.toolApiPortInjected !== true) {{
                        window.toolApiPortInjected = true;
                        const apiUrlInput = document.getElementById('api-base-url');
                        if (apiUrlInput) {{
                            apiUrlInput.value = 'http://localhost:{actualPort}';
                            localStorage.setItem('tool_api_url', 'http://localhost:{actualPort}');
                        }}
                    }}
                ";
                await webView.CoreWebView2.ExecuteScriptAsync(script);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to start Tool API server: {ex.Message}", "Error",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        private async void CoreWebView2_WebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                var message = e.TryGetWebMessageAsString();
                var data = JsonConvert.DeserializeObject<Dictionary<string, object?>>(message);

                if (data == null) return;

                switch (data.GetValueOrDefault("type")?.ToString())
                {
                    case "execute_tool":
                        await HandleToolExecution(data);
                        break;
                    case "permission_request":
                        await HandlePermissionRequest(data);
                        break;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error handling web message: {ex.Message}");
            }
        }

        private async Task HandleToolExecution(Dictionary<string, object?> data)
        {
            try
            {
                if (toolApiServer == null) return;

                var toolName = data.GetValueOrDefault("toolName")?.ToString();
                var paramsJson = data.GetValueOrDefault("params")?.ToString();

                if (string.IsNullOrEmpty(toolName)) return;

                // Execute tool via API
                var response = await httpClient.PostAsync(
                    $"http://localhost:{toolApiServer.Port}/api/tools/execute",
                    new StringContent(
                        JsonConvert.SerializeObject(new { toolName, params = JsonConvert.DeserializeObject(paramsJson) }),
                        Encoding.UTF8,
                        "application/json"
                    )
                );

                var result = await response.Content.ReadAsStringAsync();
                var resultData = JsonConvert.DeserializeObject<Dictionary<string, object?>>(result);

                // Send result back to WebView
                var responseScript = $@"
                    window.chrome.webview.postMessage({JsonConvert.SerializeObject(new
                    {
                        type = "tool_result",
                        toolName,
                        result = resultData
                    })});
                ";

                await webView.CoreWebView2.ExecuteScriptAsync(responseScript);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Tool execution error: {ex.Message}");
            }
        }

        private async Task HandlePermissionRequest(Dictionary<string, object?> data)
        {
            try
            {
                var toolName = data.GetValueOrDefault("toolName")?.ToString();
                var description = data.GetValueOrDefault("description")?.ToString();

                // Show permission dialog
                var result = MessageBox.Show(
                    $"Tool '{toolName}' wants to execute.\n\n{description}\n\nAllow?",
                    "Permission Request",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Question
                );

                var allowed = result == DialogResult.Yes;

                // Send response to WebView
                var responseScript = $@"
                    window.chrome.webview.postMessage({JsonConvert.SerializeObject(new
                    {
                        type = "permission_response",
                        toolName,
                        allowed
                    })});
                ";

                await webView.CoreWebView2.ExecuteScriptAsync(responseScript);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Permission request error: {ex.Message}");
            }
        }

        protected override async void OnFormClosing(FormClosingEventArgs e)
        {
            // Clean up
            cancellationTokenSource?.Cancel();
            
            if (toolApiServer != null)
            {
                await toolApiServer.StopAsync();
            }

            webView?.Dispose();
            base.OnFormClosing(e);
        }
    }

    /// <summary>
    /// Host object exposed to JavaScript
    /// </summary>
    [ComVisible(true)]
    public class HostObject
    {
        private readonly MainForm mainForm;

        public HostObject(MainForm mainForm)
        {
            this.mainForm = mainForm;
        }

        public void Log(string message)
        {
            Console.WriteLine($"[WebView] {message}");
        }

        public void ShowNotification(string title, string message)
        {
            MessageBox.Show(message, title, MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
    }
}
