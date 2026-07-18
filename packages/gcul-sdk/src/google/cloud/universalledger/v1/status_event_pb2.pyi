import datetime

from google.api import field_behavior_pb2 as _field_behavior_pb2
from google.protobuf import timestamp_pb2 as _timestamp_pb2
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class EventType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    EVENT_TYPE_UNSPECIFIED: _ClassVar[EventType]
    EVENT_TYPE_RECEIVED: _ClassVar[EventType]
    EVENT_TYPE_BROADCASTED: _ClassVar[EventType]
    EVENT_TYPE_ORDERED: _ClassVar[EventType]
    EVENT_TYPE_EXECUTION_STARTED: _ClassVar[EventType]
    EVENT_TYPE_EXECUTION_COMPLETED: _ClassVar[EventType]
    EVENT_TYPE_FINALIZED: _ClassVar[EventType]
EVENT_TYPE_UNSPECIFIED: EventType
EVENT_TYPE_RECEIVED: EventType
EVENT_TYPE_BROADCASTED: EventType
EVENT_TYPE_ORDERED: EventType
EVENT_TYPE_EXECUTION_STARTED: EventType
EVENT_TYPE_EXECUTION_COMPLETED: EventType
EVENT_TYPE_FINALIZED: EventType

class StatusEvent(_message.Message):
    __slots__ = ("event_time", "event_type", "event_details")
    EVENT_TIME_FIELD_NUMBER: _ClassVar[int]
    EVENT_TYPE_FIELD_NUMBER: _ClassVar[int]
    EVENT_DETAILS_FIELD_NUMBER: _ClassVar[int]
    event_time: _timestamp_pb2.Timestamp
    event_type: EventType
    event_details: EventDetails
    def __init__(self, event_time: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., event_type: _Optional[_Union[EventType, str]] = ..., event_details: _Optional[_Union[EventDetails, _Mapping]] = ...) -> None: ...

class EventDetails(_message.Message):
    __slots__ = ("execution_details",)
    EXECUTION_DETAILS_FIELD_NUMBER: _ClassVar[int]
    execution_details: ExecutionDetails
    def __init__(self, execution_details: _Optional[_Union[ExecutionDetails, _Mapping]] = ...) -> None: ...

class ExecutionDetails(_message.Message):
    __slots__ = ("round_id",)
    ROUND_ID_FIELD_NUMBER: _ClassVar[int]
    round_id: int
    def __init__(self, round_id: _Optional[int] = ...) -> None: ...
