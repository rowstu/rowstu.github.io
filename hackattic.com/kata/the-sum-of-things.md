```
import sys
import re

def main():

    
    input = (sys.stdin.read().split(sep="\n", maxsplit=-1))
    
    for i in input:
        
        total = 0
        
        for j in i.split():
            
            # check if number and add to total
            if j.isnumeric():
                total += int(j)
            
            
            # check if hex 0x, convert to integer and add to total
            if re.fullmatch(r"^0x[0-9A-Fa-f]+$", j):
                # print(f"it looks like {j} is hex")
                total = total + int(j, 16)
            
            # check if binary, convert to integer and add to total
            if re.fullmatch(r"^0b[0-1]+$", j):
                 # print(f"it looks like {j} is binary")
                 total = total + int(j, 2)
                
            # check if octal, convert to integer and add to total
            if re.fullmatch(r"^0o[0-9]+$", j):
                 # print(f"it looks like {j} is binary")
                 total = total + int(j, 8)
            
            # check if ascii, convert to integer and add to total
            if len(j) == 1 and j.isascii() and not j.isdigit():
                 #print(f"it looks like {j} is ascii")
                 total = total + ord(j)
            
        print(total)

if __name__ == "__main__":
    main()
```

experimenting to check for ASCII character:

```
def is_ascii_single_char(s):
    if len(s) == 1 and s.isascii() and not s.isdigit():
        return True
    elif len(s) > 1:
        return False
    # Check if it's not hex, binary, octal, or numeric
    return not (s.startswith(("0x", "0b", "0o")) or s.isdigit())

# Test cases
print(is_ascii_single_char("a"))  # True
print(is_ascii_single_char("0x41"))  # False
print(is_ascii_single_char("1"))  # False
print(is_ascii_single_char("0b1"))  # False
print(is_ascii_single_char("#"))  # True
```

or using regex:

```
import re

def is_ascii_single_char_regex(s):
    # Matches a single ASCII character excluding hex, binary, octal, and digits
    return bool(re.fullmatch(r"[^0-9]|[\x20-\x7E]", s)) and not re.match(r"(0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+|\d+)", s)

# Test cases
print(is_ascii_single_char_regex("a"))  # True
print(is_ascii_single_char_regex("0x41"))  # False
print(is_ascii_single_char_regex("1"))  # False
print(is_ascii_single_char_regex("0b1"))  # False
print(is_ascii_single_char_regex("#"))  # True
```

isascii() was added to Python 3.7

* https://www.geeksforgeeks.org/python-check-if-given-string-is-numeric-or-not/
* https://stackoverflow.com/questions/209513/convert-hex-string-to-integer-in-python
