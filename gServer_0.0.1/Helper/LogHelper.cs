using System;
using log4net;

namespace gServer_0._0._1.Helper
{
    public static class LogHelper
    {
        private static readonly ILog _log = LogManager.GetLogger(typeof(LogHelper));
        public static void LogError(string message, Exception ex = null)
        {
            if (ex != null)
            {
                _log.Error(message, ex);
            }
            else
            {
                _log.Error(message);
            }
        }
        public static void LogInfo(string message)
        {
            _log.Info(message);
        }
        public static void LogWarn(string message)
        {
            _log.Warn(message);
        }
    }
}