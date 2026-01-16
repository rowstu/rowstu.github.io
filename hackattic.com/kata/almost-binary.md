```
import sys

def main():
    input = (sys.stdin.read().split())
    
    
    
    for i in input:
        
        binary = []
        
        for t in i:
            if t == "#":
                binary.append("1")
            if t == ".":
                binary.append("0")
        x = ''.join(binary)
        decimal_number = int(x, 2)
        print(decimal_number)

if __name__ == "__main__":
    main()
```

* https://www.javatpoint.com/how-to-convert-binary-to-decimal-numbers-in-python

The second parameter of int() function indicates that the number is in base-2 (binary) format.
