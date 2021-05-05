# syntax=docker/dockerfile:1
FROM python:3.8-slim-buster
WORKDIR = /trackerNgin
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
COPY . .
CMD [ "uvicorn", "TrackerNgin.asgi:application", "--port", "10000", "--uds", "/tmp/trackerngin.sock"]
# CMD [ "./manage.py", "runserver", "10000"]