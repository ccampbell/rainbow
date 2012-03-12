#!/usr/bin/env python
import sys, os, subprocess

sys.argv.pop(0)
languages = sys.argv
languages.sort()

js_path = os.path.dirname(__file__) + '/../js/'

js_files_to_include = [js_path + 'rainbow.js']
included_languages = []

for language in languages:
    path = js_path + 'language/' + language + '.js'
    if not os.path.isfile(path):
        print "no file for language: ",language
        continue

    included_languages.append(language)
    js_files_to_include.append(path)

print 'waiting for closure compiler...'
proc = subprocess.Popen(['java', '-jar', '/usr/local/compiler-latest/compiler.jar', '--compilation_level', 'ADVANCED_OPTIMIZATIONS'] + js_files_to_include, stdout = subprocess.PIPE, stderr = subprocess.PIPE)
output, err = proc.communicate()

file_name = 'rainbow' + ('+' + '+'.join(included_languages) if len(included_languages) else '') + '.min.js'
print 'writing to file:',file_name

new_file = js_path + file_name

file = open(new_file, "w")
file.write(output)
file.close()


