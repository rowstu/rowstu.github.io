```
import base64
import sys


def main():
    for encoded in sys.stdin:
        decoded_bytes = base64.b64decode(encoded)
        decoded_string = decoded_bytes.decode('utf-8')
        print(decoded_string)

if __name__ == "__main__":
    main()
```

Sites used to solve this:

* https://www.digitalocean.com/community/tutorials/read-stdin-python
* https://www.geeksforgeeks.org/encoding-and-decoding-base64-strings-in-python/
* https://docs.python.org/3/library/base64.html#base64.b64decode
