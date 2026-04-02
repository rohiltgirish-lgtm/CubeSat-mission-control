import uvicorn

if __name__ == "__main__":
    print("Starting CubeSat Alert Backend...")
    # run with auto-reload for development
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
