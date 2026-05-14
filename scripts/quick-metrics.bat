@echo off
chcp 65001 >nul
echo.
echo 🖥️  METRICAS RAPIDAS DEL PC
echo ============================
echo.

echo 💻 CPU:
wmic cpu get loadpercentage /value 2>nul | find "="
echo.

echo 🧠 RAM:
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value 2>nul | find "="
echo.

echo 💾 Disco C:
for /f "tokens=1-3" %%a in ('wmic logicaldisk where "DeviceID='C:'" get Size^,FreeSpace^,Description /value 2^>nul ^| find "="') do (
    echo %%a
    echo %%b
    echo %%c
)
echo.

echo 🔥 Procesos (Top 5 por uso de memoria):
tasklist /fi "STATUS eq running" /fo table /nh | sort /r /+58 | head -6
echo.

echo 🌐 Interfaces de red:
netstat -e
echo.

pause
