from modules import *

create_keys()  # Обновление RSA ключей

if __name__ == "__main__":
    tm.run(host='127.0.0.1', port=5000)
