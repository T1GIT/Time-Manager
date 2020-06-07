from os import makedirs, path

keys_path = path.abspath('modules/security/keys')
db_path = path.abspath('databases')
temp_path = path.abspath('templates')
stat_path = path.abspath('static')
av_path = stat_path + '\\avatars'

makedirs(keys_path, exist_ok=True)
makedirs(db_path, exist_ok=True)
makedirs(av_path, exist_ok=True)
