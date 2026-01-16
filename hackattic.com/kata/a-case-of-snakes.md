```
import sys
import re

def main():
    
    input = (sys.stdin.read().split())
    
    for i in input:
        
        # remove the initial prefix
        prefix_removed = re.sub(r'^(f|p|b|n|d|dw|i16|i64|i32|u64|u32|ch|w)+', '', i)

        # do a lookback and insert the underscore
        underscore_added = re.sub(r'(?<!^)([A-Z])', r'_\1', prefix_removed)

        # convert all of that to lowercase
        print(underscore_added.lower())    
    
if __name__ == "__main__":
    main()
```

* https://chatgpt.com/c/6745e36e-a18c-8005-a99b-f0a45a742423

a lambda version

```
import re

def clean_and_format(input_string):
    return re.sub(
        r'^(f|p|b|dw|i32|u64|ch|w)+|(?<!^)([A-Z])',
        lambda m: '_' + m.group(2) if m.group(2) else '',
        input_string
    )

# Test examples
examples = [
    "fAir2DangerLevel",
    "u32Air2Ratio",
    "fnMixtureParam",
    "szWindowContents",
    "WindowContents",
    "thrustMass",
    "dwPlane",
    "i32VectorSettings",
    "chBufferZone",
]

cleaned_examples = [clean_and_format(example) for example in examples]
print(cleaned_examples)

```
