from datasets import load_dataset
try:
    ds = load_dataset("mbpp", split="train")
    if ds:
        print("Schema mbpp:", ds[0].keys())
        print("First item:", {k: v for k, v in ds[0].items()})
except Exception as e:
    print("Error mbpp:", e)
