import os
import subprocess
import zipfile
import hashlib
import re
from zipfile import ZipFile
from StringIO import StringIO


class RainbowBuilder(object):
    def __init__(self, js_path, closure_path):
        self.js_path = js_path
        self.closure_path = closure_path
        self.js_files_to_include = []
        self.file_name = ""

    def getPathForLanguage(self, language):
        return os.path.join(self.js_path, 'language/' + language + '.js')

    def getRainbowPath(self):
        return os.path.join(self.js_path, 'rainbow.js')

    def verifyPaths(self):
        if not os.path.exists(self.js_path):
            raise Exception('directory does not exist at: %s' % self.js_path)

        if not os.path.isfile(self.closure_path):
            raise Exception('closure compiler does not exist at: %s' % self.closure_path)

    def getZipForLanguages(self, languages, path=None):
        self.verifyPaths()

        # strip out any duplicates
        languages = list(set(languages))

        write_to = StringIO() if path is None else path
        zip_file = ZipFile(write_to, 'w')
        zip_file.write(self.getRainbowPath(), 'rainbow.js', zipfile.ZIP_DEFLATED)

        for language in languages:
            zip_file.write(self.getPathForLanguage(language), os.path.join('language', language + '.js'), zipfile.ZIP_DEFLATED)

        zip_file.close()

        return write_to

    def openFile(self, path):
        file = open(path, "r")
        content = file.read()
        file.close()
        return content

    def writeFile(self, path, content):
        file = open(path, "w")
        file.write(content)
        file.close()

    def getVersion(self):
        contents = self.openFile(self.getRainbowPath())
        match = re.search(r'@version\s(.*)\s+?', contents)
        return match.group(1)

    def getFileForLanguages(self, languages, cache_dir=None):
        self.verifyPaths()

        # strip out any duplicates
        languages = list(set(languages))

        self.js_files_to_include = [self.getRainbowPath()]
        for language in languages:
            path = self.getPathForLanguage(language)
            if not os.path.exists(path):
                continue

            self.js_files_to_include.append(path)

        self.file_name = 'rainbow' + ('-custom' if len(languages) else '') + '.min.js'

        if not os.path.isdir(cache_dir):
            cache_dir = None

        if cache_dir is not None:
            version = self.getVersion()
            cache_key = hashlib.md5(''.join(self.js_files_to_include)).hexdigest()
            cache_path = os.path.join(cache_dir, version, cache_key)

            if os.path.isfile(cache_path):
                return self.openFile(cache_path)

        command = ['java', '-jar', self.closure_path, '--compilation_level', 'ADVANCED_OPTIMIZATIONS'] + self.js_files_to_include
        proc = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        output, err = proc.communicate()

        lines = output.splitlines()
        comments = lines[0:4]
        version = comments[1].replace(' @version ', '')
        url = comments[2].replace(' @url ', '')
        new_comment = '/* Rainbow v' + version + ' ' + url

        if len(languages):
            new_comment += ' | included languages: ' + ', '.join(languages)

        new_comment += ' */'

        output = new_comment + '\n' + '\n'.join(lines[4:])

        if cache_dir is not None:
            save_to = os.path.join(cache_dir, version)
            if not os.path.isdir(save_to):
                os.mkdir(save_to)
            self.writeFile(cache_path, output)

        return output
