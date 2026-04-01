using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace QwenCode.WebView2
{
    /// <summary>
    /// Tool API server that exposes Qwen Code tools via HTTP
    /// </summary>
    public class ToolApiServer : IDisposable
    {
        private readonly string workspacePath;
        private readonly int port;
        private Process? nodeProcess;
        private bool disposed;

        public int Port => port;

        public ToolApiServer(string workspacePath, int port = 3456)
        {
            this.workspacePath = workspacePath;
            this.port = port;
        }

        /// <summary>
        /// Start the Tool API server
        /// </summary>
        public async Task<int> StartAsync(CancellationToken cancellationToken)
        {
            try
            {
                // Find the tool-api-server.js script
                var scriptPath = FindScriptPath();
                
                if (!File.Exists(scriptPath))
                {
                    throw new FileNotFoundException($"Tool API server script not found at: {scriptPath}");
                }

                // Start Node.js process
                var startInfo = new ProcessStartInfo
                {
                    FileName = "node",
                    Arguments = $"\"{scriptPath}\" --port {port}",
                    WorkingDirectory = Path.GetDirectoryName(scriptPath)!,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };

                nodeProcess = Process.Start(startInfo);
                
                if (nodeProcess == null)
                {
                    throw new Exception("Failed to start Node.js process");
                }

                // Log output
                nodeProcess.OutputDataReceived += (s, e) => 
                {
                    if (!string.IsNullOrEmpty(e.Data))
                    {
                        Console.WriteLine($"[ToolAPI] {e.Data}");
                    }
                };
                
                nodeProcess.ErrorDataReceived += (s, e) => 
                {
                    if (!string.IsNullOrEmpty(e.Data))
                    {
                        Console.WriteLine($"[ToolAPI Error] {e.Data}");
                    }
                };

                nodeProcess.BeginOutputReadLine();
                nodeProcess.BeginErrorReadLine();

                // Wait for server to start
                await WaitForServerStart(cancellationToken);

                return port;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to start Tool API server: {ex.Message}");
                throw;
            }
        }

        private string FindScriptPath()
        {
            // Try multiple locations
            var possiblePaths = new[]
            {
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "tool-api-server.js"),
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "dist", "tool-api-server.js"),
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "node_modules", "@qwen-code", "webview2-deepseek", "dist", "tool-api-server.js")
            };

            foreach (var path in possiblePaths)
            {
                var fullPath = Path.GetFullPath(path);
                if (File.Exists(fullPath))
                {
                    return fullPath;
                }
            }

            return possiblePaths[0]; // Return first path for error message
        }

        private async Task WaitForServerStart(CancellationToken cancellationToken)
        {
            var maxAttempts = 30;
            var delayMs = 200;

            using var httpClient = new HttpClient();
            httpClient.Timeout = TimeSpan.FromSeconds(1);

            for (int i = 0; i < maxAttempts; i++)
            {
                try
                {
                    var response = await httpClient.GetAsync($"http://localhost:{port}/health", cancellationToken);
                    if (response.IsSuccessStatusCode)
                    {
                        Console.WriteLine($"Tool API server is ready on port {port}");
                        return;
                    }
                }
                catch
                {
                    // Server not ready yet
                }

                await Task.Delay(delayMs, cancellationToken);
            }

            throw new TimeoutException($"Tool API server failed to start within {maxAttempts * delayMs}ms");
        }

        /// <summary>
        /// Stop the Tool API server
        /// </summary>
        public async Task StopAsync()
        {
            if (nodeProcess != null && !nodeProcess.HasExited)
            {
                try
                {
                    // Graceful shutdown
                    nodeProcess.Kill(entireProcessTree: true);
                    await nodeProcess.WaitForExitAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error stopping Tool API server: {ex.Message}");
                }
                finally
                {
                    nodeProcess.Dispose();
                    nodeProcess = null;
                }
            }
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!disposed)
            {
                if (disposing)
                {
                    StopAsync().Wait();
                }
                disposed = true;
            }
        }

        public void Dispose()
        {
            Dispose(disposing: true);
            GC.SuppressFinalize(this);
        }
    }
}
