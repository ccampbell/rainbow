#!/usr/bin/env python
import sys, os, subprocess, glob

sys.argv.pop(0)
languages = sys.argv
languages.sort()

js_path = os.path.dirname(__file__) + '/../js/'

js_files_to_include = [js_path + 'rainbow.js']
included_languages = []

all_files = '--all' in sys.argv

if all_files:
    languages = []
    files = glob.glob(js_path + 'language/*.js')
    for file in files:
        languages.append(os.path.basename(file).replace('.js', ''))

for language in languages:
    path = js_path + 'language/' + language + '.js'
    if not os.path.isfile(path):
        print "no file for language: ",language
        continue

    included_languages.append(language)
    js_files_to_include.append(path)

closure_path = '/usr/local/compiler-latest/compiler.jar'
if not os.path.isfile(closure_path):
    sys.exit('could not find closure compiler at ' + closure_path)

print 'waiting for closure compiler...'
proc = subprocess.Popen(['java', '-jar', '/usr/local/compiler-latest/compiler.jar', '--compilation_level', 'ADVANCED_OPTIMIZATIONS'] + js_files_to_include, stdout = subprocess.PIPE, stderr = subprocess.PIPE)
output, err = proc.communicate()

file_name = 'rainbow' + ('-custom' if len(included_languages) or all_files else '') + '.min.js'

lines = output.splitlines()
comments = lines[0:4]
version = comments[1].replace(' @version ', '')
url = comments[2].replace(' @url ', '')
new_comment = '/* Rainbow v' + version + ' ' + url

if all_files or len(included_languages):
    new_comment += ' | included languages: ' + ', '.join(included_languages)

new_comment += ' */'

output = new_comment + '\n' + '\n'.join(lines[4:])

print "\nincluded:"
for file in js_files_to_include:
    print "    ",os.path.basename(file)
print ""

print 'writing to file:',file_name

new_file = js_path + file_name

file = open(new_file, "w")
file.write(output)
file.close()
