```
import sys

def main():
    
    low,high = (sys.stdin.read().split())
    
    for i in range(int(low),int(high)+1):
        if i % 3 == 0 and i % 5 == 0:
            print("FizzBuzz")
        elif i % 3 == 0:
            print("Fizz")
        elif i % 5 == 0:
            print("Buzz")
        else:
            print(i)

if __name__ == "__main__":
    main()
```

resources used to solve this:
* https://www.digitalocean.com/community/tutorials/python-add-to-list
* https://www.geeksforgeeks.org/iterate-over-a-list-in-python/
* https://docs.python.org/3/library/io.html#
