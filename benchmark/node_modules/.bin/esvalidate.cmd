@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\..\esprima\bin\esvalidate.js" %*
) ELSE (
  node  "%~dp0\..\esprima\bin\esvalidate.js" %*
)