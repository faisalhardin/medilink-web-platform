import { CommonResponse } from "@models/common";
import { OrderProductRequest } from "@models/patient";
import { Product } from "@models/product";
import { getToken } from "@utils/storage";
import axios from "axios";
import { PATIENT_VISIT_PRODUCT_ORDER_PATH } from "constants/constants";

