from typing import Annotated

from pydantic import BaseModel, BeforeValidator, ConfigDict


def _object_id_to_str(value: object) -> object:
    if value is None:
        return None
    return str(value)


ObjectIdStr = Annotated[str, BeforeValidator(_object_id_to_str)]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
