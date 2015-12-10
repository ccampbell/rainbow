/**
 * NSIS patterns
 *
 * @author Jan T. Sott
 * @version 1.0.0
 */
Rainbow.extend('nsis', [
    
    {
        'name': 'comment.line',
        'pattern': /(\#|;)[\s\S]*?$/gm
    },
    {
        'name': 'comment.block',
        'pattern': /\/\*[\s\S]*?\*\/|(\/\/|\#)[\s\S]*?$/gm
    },
    {
        'name': 'constant.numeric',
        'pattern': /\b(\d+(\.\d+)?(e(\+|\-)?\d+)?(f|d)?|0x[\da-f]+)\b/gi
    },
    {
        'name': 'constant.language',
        'pattern': /\b((un\.)?components|(un\.)?custom|(un\.)?directory|(un\.)?instfiles|(un\.)?license|uninstConfirm|admin|all|auto|both|bottom|bzip2|current|false|force|hide|highest|ifdiff|ifnewer|lastused|leave|left|listonly|lzma|nevershow|none|normal|notset|off|on|right|show|silent|silentlog|textonly|top|true|try|user|Win10|Win7|Win8|WinVista|zlib)(?=\(|\b)/g
    },

    {
        'name': 'constant.option',
        'pattern': /\b(ARCHIVE|FILE_ATTRIBUTE_ARCHIVE|FILE_ATTRIBUTE_HIDDEN|FILE_ATTRIBUTE_NORMAL|FILE_ATTRIBUTE_OFFLINE|FILE_ATTRIBUTE_READONLY|FILE_ATTRIBUTE_SYSTEM|FILE_ATTRIBUTE_TEMPORARY|HIDDEN|HKCC|HKCR|HKCU|HKDD|HKEY_CLASSES_ROOT|HKEY_CURRENT_CONFIG|HKEY_CURRENT_USER|HKEY_DYN_DATA|HKEY_LOCAL_MACHINE|HKEY_PERFORMANCE_DATA|HKEY_USERS|HKLM|HKPD|HKU|IDABORT|IDCANCEL|IDD_DIR|IDD_INST|IDD_INSTFILES|IDD_LICENSE|IDD_SELCOM|IDD_UNINST|IDD_VERIFY|IDIGNORE|IDNO|IDOK|IDRETRY|IDYES|MB_ABORTRETRYIGNORE|MB_DEFBUTTON1|MB_DEFBUTTON2|MB_DEFBUTTON3|MB_DEFBUTTON4|MB_ICONEXCLAMATION|MB_ICONINFORMATION|MB_ICONQUESTION|MB_ICONSTOP|MB_OK|MB_OKCANCEL|MB_RETRYCANCEL|MB_RIGHT|MB_RTLREADING|MB_SETFOREGROUND|MB_TOPMOST|MB_USERICON|MB_YESNO|MB_YESNOCANCEL|NORMAL|OFFLINE|READONLY|SHCTX|SHELL_CONTEXT|SW_HIDE|SW_SHOWDEFAULT|SW_SHOWMAXIMIZED|SW_SHOWMINIMIZED|SW_SHOWNORMAL|SYSTEM|TEMPORARY)(?=\(|\b)/g
    },
    {
        'matches': {
            1: 'variable.dollar-sign',
            2: 'variable'
        },
        'pattern': /(\$)(\w+)\b/g
    },
    {
        'name': 'variable.definition',
        'pattern': /\${[\w]+}/g
    },
    {
        'name': 'variable.language',
        'pattern': /\$\([\w]+\)/g
    },
    {
        'name': 'support.compiler',
        'pattern': /\!(include|addincludedir|addplugindir|appendfile|cd|delfile|echo|error|execute|packhdr|finalize|getdllversion|system|tempfile|warning|verbose|define|undef|insertmacro|macro|macroend|makensis|searchparse|searchreplace)(?=\(|\b)/g
    },
    {
        'name': 'entity.compiler.block',
        'pattern': /(\!)(ifdef|ifndef|if|ifmacrodef|ifmacrondef|else|endif)(?=\(|\b)/g
    },
    {
        'name': 'keyword.command',
        'pattern': /\b(Abort|AddBrandingImage|AddSize|AllowRootDirInstall|AllowSkipFiles|AutoCloseWindow|BGFont|BGGradient|BrandingText|BringToFront|Call|CallInstDLL|Caption|ChangeUI|CheckBitmap|ClearErrors|CompletedText|ComponentText|CopyFiles|CRCCheck|CreateDirectory|CreateFont|CreateShortCut|Delete|DeleteINISec|DeleteINIStr|DeleteRegKey|DeleteRegValue|DetailPrint|DetailsButtonText|DirText|DirVar|DirVerify|EnableWindow|EnumRegKey|EnumRegValue|Exch|Exec|ExecShell|ExecWait|ExpandEnvStrings|File|FileBufSize|FileClose|FileErrorText|FileOpen|FileRead|FileReadByte|FileReadUTF16LE|FileReadWord|FileWriteUTF16LE|FileSeek|FileWrite|FileWriteByte|FileWriteWord|FindClose|FindFirst|FindNext|FindWindow|FlushINI|GetCurInstType|GetCurrentAddress|GetDlgItem|GetDLLVersion|GetDLLVersionLocal|GetErrorLevel|GetFileTime|GetFileTimeLocal|GetFullPathName|GetFunctionAddress|GetInstDirError|GetLabelAddress|GetTempFileName|Goto|HideWindow|Icon|IfAbort|IfErrors|IfFileExists|IfRebootFlag|IfSilent|InitPluginsDir|InstallButtonText|InstallColors|InstallDir|InstallDirRegKey|InstProgressFlags|InstType|InstTypeGetText|InstTypeSetText|IntCmp|IntCmpU|IntFmt|IntOp|IsWindow|LangString|LicenseBkColor|LicenseData|LicenseForceSelection|LicenseLangString|LicenseText|LoadLanguageFile|LockWindow|LogSet|LogText|ManifestDPIAware|ManifestSupportedOS|MessageBox|MiscButtonText|Name|Nop|OutFile|Page|PageCallbacks|Pop|Push|Quit|ReadEnvStr|ReadINIStr|ReadRegDWORD|ReadRegStr|Reboot|RegDLL|Rename|RequestExecutionLevel|ReserveFile|Return|RMDir|SearchPath|SectionGetFlags|SectionGetInstTypes|SectionGetSize|SectionGetText|SectionIn|SectionSetFlags|SectionSetInstTypes|SectionSetSize|SectionSetText|SendMessage|SetAutoClose|SetBrandingImage|SetCompress|SetCompressor|SetCompressorDictSize|SetCtlColors|SetCurInstType|SetDatablockOptimize|SetDateSave|SetDetailsPrint|SetDetailsView|SetErrorLevel|SetErrors|SetFileAttributes|SetFont|SetOutPath|SetOverwrite|SetPluginUnload|SetRebootFlag|SetRegView|SetShellVarContext|SetSilent|ShowInstDetails|ShowUninstDetails|ShowWindow|SilentInstall|SilentUnInstall|Sleep|SpaceTexts|StrCmp|StrCmpS|StrCpy|StrLen|SubCaption|Unicode|UninstallButtonText|UninstallCaption|UninstallIcon|UninstallSubCaption|UninstallText|UninstPage|UnRegDLL|Var|VIAddVersionKey|VIFileVersion|VIProductVersion|WindowIcon|WriteINIStr|WriteRegBin|WriteRegDWORD|WriteRegExpandStr|WriteRegStr|WriteUninstaller|XPStyle)(?=\(|\b)/g
    },
    {
        'name': 'keyword.plugin',
        'pattern': /\b(\w+\:\:\w+)(?=\(|\b)/g
    },
    {
        'name': 'entity.command.block',
        'pattern': /\b(Function|FunctionEnd|Section|SectionEnd|SectionGroup|SectionGroupEnd|SubSection|SubSectionEnd|PageEx|PageExEnd)(?=\(|\b)/g
    },
    {
        'name': 'string',
        'matches': {
            1: 'string.open',
            2: [{
                'name': 'string.interpolation',
                'matches': {
                    1: 'string.open',
                    2: {
                      'language': 'nsis'
                    },
                    3: 'string.close'
                },
                'pattern': /(\#\{)(.*?)(\})/g
            }],
            3: 'string.close'
        },
        'pattern': /("|`|')(.*?[^\\\1])?(\1)/g
    }
], true);
